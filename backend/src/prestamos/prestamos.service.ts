import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { DataSource, In } from 'typeorm';

import { CrearSolicitudDto } from './dto/crear-solicitud.dto';
import { Prestamo } from './entities/prestamo.entity';

import { Usuario } from '../usuarios/entities/usuarios.entity';
import { Inscripcion } from '../academico/entities/inscripciones.entity';
import { Recurso } from '../inventario/entities/recursos.entity';

import { SolicitudPrestamo } from './entities/solicitud-prestamo.entity';
import { DetalleSolicitud } from './entities/detalle-solicitud.entity';
import { DecisionMotpi } from './entities/decision-motpi.entity';

import { EngineService } from '../motpi-engine/engine.service';
import { TokenAuditService } from '../motpi-engine/token-audit.service';

import {
  Accion,
  CondicionAcademica,
  EvaluateMultipleAccessDto,
  TipoRecurso,
} from '../motpi-engine/dto/evaluate-access.dto';

@Injectable()
export class PrestamosService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly engineService: EngineService,
    private readonly tokenAuditService: TokenAuditService,
  ) {}

  // 1. Crear y evaluar una solicitud de préstamo.
  async crearSolicitud(dto: CrearSolicitudDto, idUsuario: string,) {
    const usuarioRepository =
      this.dataSource.getRepository(Usuario);

    const usuario = await usuarioRepository.findOne({
      where: {
        id_usuario: idUsuario,
      },
      relations: {
        rol: true,
      },
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    if (usuario.estado !== 'ACTIVO') {
      throw new BadRequestException(
        'El usuario no está activo.',
      );
    }

    if (usuario.rol.nombre !== 'ESTUDIANTE') {
      throw new BadRequestException(
        'Solo los estudiantes pueden solicitar préstamos.',
      );
    }

    // 2. Validar fecha prevista de devolución.
    const fechaDevolucionPrevista = new Date(
      dto.fechaDevolucionPrevista,
    );

    if (
      Number.isNaN(fechaDevolucionPrevista.getTime()) ||
      fechaDevolucionPrevista <= new Date()
    ) {
      throw new BadRequestException(
        'La fecha de devolución debe ser posterior a la fecha actual.',
      );
    }

    // 3. Consultar inscripciones activas.
    const inscripcionRepository =
      this.dataSource.getRepository(Inscripcion);

    const inscripciones = await inscripcionRepository.find({
      where: {
        usuario: {
          id_usuario: usuario.id_usuario,
        },
        estado: 'ACTIVA',
      },
      relations: {
        materia: true,
      },
    });

    const materiasInscritas = inscripciones.map(
      (inscripcion) => inscripcion.materia.nombre,
    );

    const materiaInscrita = materiasInscritas.some(
      (materia) =>
        materia.toLowerCase() ===
        dto.materiaActual.toLowerCase(),
    );

    if (!materiaInscrita) {
      throw new BadRequestException(
        'El estudiante no está inscrito en la materia indicada.',
      );
    }

    // 4. Iniciar transacción y bloquear los equipos.
    return this.dataSource.transaction(async (manager) => {
      const recursoRepository =
        manager.getRepository(Recurso);

      const recursos = await recursoRepository.find({
        where: {
          id_recurso: In(dto.recursos),
        },
        order: {
          id_recurso: 'ASC',
        },
        lock: {
          mode: 'pessimistic_write',
        },
      });

      if (recursos.length !== dto.recursos.length) {
        throw new NotFoundException(
          'Uno o varios equipos no existen en el inventario.',
        );
      }

      const recursosNoDisponibles = recursos.filter(
        (recurso) => recurso.estado !== 'DISPONIBLE',
      );

      if (recursosNoDisponibles.length > 0) {
        throw new BadRequestException(
          'Uno o varios equipos no están disponibles.',
        );
      }

      // 5. Identificar el tipo específico de cada equipo.
      const identificarTipoRecurso = (
        nombre: string,
      ): TipoRecurso => {
        const nombreNormalizado = nombre
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase()
          .trim();

        const tipos: Record<string, TipoRecurso> = {
          osciloscopio: TipoRecurso.OSCILOSCOPIO,
          multimetro: TipoRecurso.MULTIMETRO,
          'fuente variable': TipoRecurso.FUENTE_VARIABLE,
          'generador de senales':
            TipoRecurso.GENERADOR_SEÑALES,
        };

        const tipo = tipos[nombreNormalizado];

        if (!tipo) {
          throw new BadRequestException(
            `MOTPI no reconoce el tipo de equipo: ${nombre}.`,
          );
        }

        return tipo;
      };

      // 6. Preparar contexto temporal.
      const ahora = new Date();

      const usarRelojPrueba =
        process.env.NODE_ENV === 'development' &&
        process.env.MOTPI_ALLOW_TEST_CLOCK === 'true';

      const horaPrueba = process.env.MOTPI_TEST_HOUR;

      if (
        usarRelojPrueba &&
        (!horaPrueba ||
          !/^([01]\d|2[0-3]):([0-5]\d)$/.test(horaPrueba))
      ) {
        throw new BadRequestException(
          'La hora de prueba de MOTPI no tiene un formato válido.',
        );
      }

      const horaSolicitud =
        usarRelojPrueba && horaPrueba
          ? horaPrueba
          : [
              String(ahora.getHours()).padStart(2, '0'),
              String(ahora.getMinutes()).padStart(2, '0'),
            ].join(':');

      const diaSemana =
        ahora.getDay() === 0 ? 7 : ahora.getDay();

      // 7. Preparar datos para el motor de políticas.
      const datosEvaluacion: EvaluateMultipleAccessDto = {
        sujeto: {
          id: usuario.id_usuario,
          rol: usuario.rol.nombre,
          condicionAcademica:
            usuario.condicion_academica === 'REGULAR'
              ? CondicionAcademica.REGULAR
              : CondicionAcademica.IRREGULAR,
          materiasInscritas,
        },
        recursos: recursos.map((recurso) => ({
          id: recurso.id_recurso,
          tipo: identificarTipoRecurso(recurso.nombre),
        })),
        accion: Accion.PRESTAMO,
        contexto: {
          horaSolicitud,
          diaSemana,
          materiaActual: dto.materiaActual,
        },
      };

      // 8. Ejecutar evaluación de MOTPI.
      const resultado =
        this.engineService.evaluateMultiple(datosEvaluacion);

      // 9. Registrar solicitud.
      const solicitudRepository =
        manager.getRepository(SolicitudPrestamo);

      const solicitud = await solicitudRepository.save({
        usuario,
        estado: 'PENDIENTE',
      });

      // 10. Registrar equipos solicitados.
      const detalleRepository =
        manager.getRepository(DetalleSolicitud);

      const detalles = recursos.map((recurso) => ({
        solicitud,
        recurso,
      }));

      await detalleRepository.save(detalles);

      // 11. Guardar decisión y justificación.
      const decisionRepository =
        manager.getRepository(DecisionMotpi);

      await decisionRepository.save({
        solicitud,
        decision: resultado.decision,
        justificacion: resultado.justificacion,
      });

      // 12. Actualizar estado de solicitud.
      let jti: string | null = null;
      let tokenJwt: string | null = null;
      let prestamo: Prestamo | null = null;

      if (resultado.decision === 'PERMITIDO') {
        solicitud.estado = 'AUTORIZADA';

        for (const recurso of recursos) {
          recurso.estado = 'RESERVADO';
        }

        await recursoRepository.save(recursos);

        // 13. Registrar préstamo.
        const prestamoRepository =
          manager.getRepository(Prestamo);

        prestamo = await prestamoRepository.save({
          solicitud,
          fecha_entrega: ahora,
          fecha_devolucion_prevista:
            fechaDevolucionPrevista,
          fecha_devolucion_real: null,
          estado: 'ACTIVO',
        });
      } else {
        solicitud.estado = 'DENEGADA';
      }

      await solicitudRepository.save(solicitud);

      // 14. Emitir JTI y JWT dentro de la transacción.
      if (resultado.decision === 'PERMITIDO') {
        const tokenGenerado =
          await this.tokenAuditService.issueToken(
            solicitud,
            manager,
          );

        jti = tokenGenerado.jti;
        tokenJwt = tokenGenerado.token;
      }

      // 15. Devolver resultado.
      return {
        success: true,
        mensaje: 'Solicitud evaluada por MOTPI.',
        solicitud: {
          id_solicitud: solicitud.id_solicitud,
          estado: solicitud.estado,
          usuario: usuario.id_usuario,
          decision: resultado.decision,
          justificacion: resultado.justificacion,
          jti,
          token: tokenJwt,
          prestamo: prestamo
            ? {
                id_prestamo: prestamo.id_prestamo,
                fecha_entrega: prestamo.fecha_entrega,
                fecha_devolucion_prevista:
                  prestamo.fecha_devolucion_prevista,
                estado: prestamo.estado,
              }
            : null,
          recursos: resultado.resultados,
        },
      };
    });
  }

  // 16. Consultar solicitudes registradas.
  // Si se proporciona un usuario, devuelve solo sus solicitudes.
  // Si no se proporciona, devuelve todas.
  async obtenerSolicitudes(idUsuario?: string) {
    const solicitudRepository =
      this.dataSource.getRepository(SolicitudPrestamo);

    const solicitudes = await solicitudRepository.find({
      where: idUsuario
        ? {
            usuario: {
              id_usuario: idUsuario,
            },
          }
        : {},
      relations: {
        usuario: true,
      },
      order: {
        fecha_solicitud: 'DESC',
      },
    });

    if (solicitudes.length === 0) {
      return {
        success: true,
        total: 0,
        solicitudes: [],
      };
    }

    const idsSolicitudes = solicitudes.map(
      (solicitud) => solicitud.id_solicitud,
    );

    const [detalles, decisiones, prestamos] = await Promise.all([
      this.dataSource.getRepository(DetalleSolicitud).find({
        where: {
          solicitud: {
            id_solicitud: In(idsSolicitudes),
          },
        },
        relations: {
          solicitud: true,
          recurso: true,
        },
      }),

      this.dataSource.getRepository(DecisionMotpi).find({
        where: {
          solicitud: {
            id_solicitud: In(idsSolicitudes),
          },
        },
        relations: {
          solicitud: true,
        },
        order: {
          fecha_evaluacion: 'DESC',
        },
      }),

      this.dataSource.getRepository(Prestamo).find({
        where: {
          solicitud: {
            id_solicitud: In(idsSolicitudes),
          },
        },
        relations: {
          solicitud: true,
        },
      }),
    ]);

    const resultado = solicitudes.map((solicitud) => {
      const id = solicitud.id_solicitud;

      const equipos = detalles
        .filter(
          (detalle) =>
            detalle.solicitud.id_solicitud === id,
        )
        .map((detalle) => ({
          id_recurso: detalle.recurso.id_recurso,
          nombre: detalle.recurso.nombre,
          estado: detalle.recurso.estado,
        }));

      const decision = decisiones.find(
        (item) => item.solicitud.id_solicitud === id,
      );

      const prestamo = prestamos.find(
        (item) => item.solicitud.id_solicitud === id,
      );

      return {
        id_solicitud: id,
        fecha_solicitud: solicitud.fecha_solicitud,
        estado: solicitud.estado,

        solicitante: {
          nombre: `${solicitud.usuario.nombre} ${solicitud.usuario.apellido}`,
          matricula: solicitud.usuario.matricula,
          correo: solicitud.usuario.correo,
        },

        equipos,

        decision: decision
          ? {
              resultado: decision.decision,
              justificacion: decision.justificacion,
              fecha_evaluacion: decision.fecha_evaluacion,
            }
          : null,

        prestamo: prestamo
          ? {
              id_prestamo: prestamo.id_prestamo,
              estado: prestamo.estado,
              fecha_entrega: prestamo.fecha_entrega,
              fecha_devolucion_prevista:
                prestamo.fecha_devolucion_prevista,
              fecha_devolucion_real:
                prestamo.fecha_devolucion_real,
            }
          : null,
      };
    });

    return {
      success: true,
      total: resultado.length,
      solicitudes: resultado,
    };
  }

  // 17. Registrar devolución de un préstamo.
  async devolverPrestamo(idPrestamo: string) {
    return this.dataSource.transaction(async (manager) => {
      const prestamoRepository =
        manager.getRepository(Prestamo);

      // Bloquear préstamo para evitar devoluciones simultáneas.
      const prestamo = await prestamoRepository.findOne({
        where: {
          id_prestamo: idPrestamo,
        },
        relations: {
          solicitud: true,
        },
        lock: {
          mode: 'pessimistic_write',
        },
      });

      if (!prestamo) {
        throw new NotFoundException(
          'Préstamo no encontrado.',
        );
      }

      if (prestamo.estado !== 'ACTIVO') {
        throw new BadRequestException(
          'El préstamo ya fue devuelto o no está activo.',
        );
      }

      // 18. Buscar todos los equipos asociados.
      const detalleRepository =
        manager.getRepository(DetalleSolicitud);

      const detalles = await detalleRepository.find({
        where: {
          solicitud: {
            id_solicitud:
              prestamo.solicitud.id_solicitud,
          },
        },
        relations: {
          recurso: true,
        },
      });

      if (detalles.length === 0) {
        throw new BadRequestException(
          'El préstamo no tiene equipos asociados.',
        );
      }

      // 19. Bloquear los equipos.
      const recursoRepository =
        manager.getRepository(Recurso);

      const recursos = await recursoRepository.find({
        where: {
          id_recurso: In(
            detalles.map(
              (detalle) => detalle.recurso.id_recurso,
            ),
          ),
        },
        order: {
          id_recurso: 'ASC',
        },
        lock: {
          mode: 'pessimistic_write',
        },
      });

      if (recursos.length !== detalles.length) {
        throw new BadRequestException(
          'No se pudieron recuperar todos los equipos del préstamo.',
        );
      }

      const recursosNoReservados = recursos.filter(
        (recurso) => recurso.estado !== 'RESERVADO',
      );

      if (recursosNoReservados.length > 0) {
        throw new BadRequestException(
          'Uno o varios equipos no tienen el estado esperado para la devolución.',
        );
      }

      // 20. Actualizar préstamo de forma atómica.
      const actualizacion = await prestamoRepository
        .createQueryBuilder()
        .update(Prestamo)
        .set({
          estado: 'DEVUELTO',
          fecha_devolucion_real: () => 'CURRENT_TIMESTAMP',
        })
        .where('id_prestamo = :idPrestamo', {
          idPrestamo,
        })
        .andWhere('estado = :estado', {
          estado: 'ACTIVO',
        })
        .returning(['fecha_devolucion_real'])
        .execute();

      if (actualizacion.affected !== 1) {
        throw new BadRequestException(
          'El préstamo ya fue devuelto o cambió de estado.',
        );
      }

      // 21. Liberar todos los equipos.
      for (const recurso of recursos) {
        recurso.estado = 'DISPONIBLE';
      }

      await recursoRepository.save(recursos);

      return {
        success: true,
        mensaje: 'Préstamo devuelto correctamente.',
        id_prestamo: idPrestamo,
        estado: 'DEVUELTO',
        fecha_devolucion_real:
          actualizacion.raw[0].fecha_devolucion_real,
        equipos_liberados: recursos.map((recurso) => ({
          id_recurso: recurso.id_recurso,
          nombre: recurso.nombre,
          estado: recurso.estado,
        })),
      };
    });
  }
}