import { normalizeArgentinePhone } from "./phone";

export interface MessageVariables {
  nombre?: string;
  fecha?: string;
  hora?: string;
  instructor?: string;
  vehiculo?: string;
  direccion?: string;
  link_reprogramar?: string;
  saldo?: string;
  [key: string]: string | undefined;
}

export interface IMessagingService {
  buildMessage(template: string, vars: MessageVariables): string;
  generateWhatsAppLink(phone: string, message: string): string;
}

export class WhatsAppAssistedService implements IMessagingService {
  buildMessage(template: string, vars: MessageVariables): string {
    let result = template;
    for (const [key, value] of Object.entries(vars)) {
      const placeholder = new RegExp(`\\{${key}\\}`, "g");
      result = result.replace(placeholder, value || "");
    }
    return result;
  }

  generateWhatsAppLink(phone: string, message: string): string {
    const normalizedPhone = normalizeArgentinePhone(phone);
    const encodedText = encodeURIComponent(message);
    return `https://wa.me/${normalizedPhone}?text=${encodedText}`;
  }
}

export const messagingService = new WhatsAppAssistedService();

export const DEFAULT_TEMPLATES = [
  {
    code: "recordatorio_turno",
    title: "Recordatorio de Turno (24/48h)",
    content:
      "¡Hola {nombre}! 🚗 Te recordamos tu clase de manejo en EAM el {fecha} a las {hora} con el instructor {instructor} en auto {vehiculo}. Por favor, presentate en {direccion} con 5 minutos de anticipación. Si necesitás reprogramar, avisanos con al menos 24 hs de anticipación: {link_reprogramar}. ¡Te esperamos!",
  },
  {
    code: "confirmacion_reserva",
    title: "Confirmación de Reserva Online",
    content:
      "¡Hola {nombre}! Tu turno en EAM fue reservado con éxito para el {fecha} a las {hora}. Instructor asignado: {instructor}. Podés consultar tu turno o cancelarlo aquí: {link_reprogramar}",
  },
  {
    code: "clase_cancelada",
    title: "Aviso de Clase Cancelada",
    content:
      "Hola {nombre}, te informamos que tu clase del {fecha} a las {hora} ha sido cancelada. Si querés reprogramarla para otro horario disponible, avisanos por este medio o ingresá en {link_reprogramar}.",
  },
  {
    code: "felicitacion_examen",
    title: "Felicitaciones por Licencia Aprobada",
    content:
      "¡FELICITACIONES {nombre}! 🎓🎉 Nos alegra contarte que ya tenemos registrado tu examen de conducir aprobado en Florencio Varela. ¡Sos oficialmente un conductor seguro! Gracias por confiar en el equipo de EAM.",
  },
  {
    code: "aviso_saldo",
    title: "Recordatorio de Saldo Pendiente",
    content:
      "Hola {nombre}, te recordamos que tenés un saldo pendiente de {saldo} correspondiente a tu pack de clases en EAM. Podés abonarlo por transferencia bancaria o en secretaría de Mitre 294.",
  },
];
