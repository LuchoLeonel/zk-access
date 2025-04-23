import { Injectable, Logger } from '@nestjs/common';
import * as Imap from 'node-imap';
import { simpleParser, ParsedMail } from 'mailparser';
import { Stream } from 'stream';

@Injectable()
export class GmailService {
  private readonly logger = new Logger(GmailService.name);

  async getLatestUnreadEmail(): Promise<string | null> {
    const user = process.env.GMAIL_USER;
    const password = process.env.GMAIL_APP_PASSWORD;

    if (!user || !password) {
      throw new Error('GMAIL_USER or GMAIL_APP_PASSWORD is missing in .env');
    }

    const imap = new Imap({
      user,
      password,
      host: 'imap.gmail.com',
      port: 993,
      tls: true,
    });

    const openInbox = (): Promise<Imap.Box> =>
      new Promise((resolve, reject) => {
        imap.openBox('INBOX', false, (err, box) => {
          if (err) reject(err);
          else resolve(box);
        });
      });

    return new Promise((resolve, reject) => {
      imap.once('ready', async () => {
        try {
          await openInbox();

          imap.search(['UNSEEN'], (err, results) => {
            if (err) {
              this.logger.error('Error al buscar correos no leídos:', err);
              imap.end();
              return reject(err);
            }

            if (!results || results.length === 0) {
              this.logger.log('No hay correos no leídos');
              imap.end();
              return resolve(null);
            }

            const f = imap.fetch(results.slice(-1), { bodies: '', struct: true });

            f.on('message', msg => {
              let rawEmail = '';

              msg.on('body', (stream) => {
                const nodeStream = stream as unknown as Stream;

                nodeStream.on('data', (chunk) => {
                  rawEmail += chunk.toString('utf-8');
                });

                nodeStream.on('end', () => {
                  this.logger.log('Correo capturado completo en formato RAW');
                  imap.end();
                  resolve(rawEmail); // ✅ raw .eml listo para zk-email
                });
              });
            });

            f.once('error', err => {
              this.logger.error('Error al obtener el mensaje:', err);
              imap.end();
              reject(err);
            });
          });
        } catch (error) {
          this.logger.error('Error inesperado:', error);
          reject(error);
        }
      });

      imap.once('error', err => {
        this.logger.error('Error de conexión IMAP:', err);
        reject(err);
      });

      imap.connect();
    });
  }
}
