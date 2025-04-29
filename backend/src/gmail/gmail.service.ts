import { Injectable, Logger } from '@nestjs/common';
import * as Imap from 'node-imap';
import { Stream } from 'stream';
import * as nodemailer from 'nodemailer'; 

@Injectable()
export class GmailService {
  private readonly logger = new Logger(GmailService.name);

  async fetchAllUnreadEmails(): Promise<string[]> {
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
      const emails: string[] = [];

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
              return resolve([]);
            }

            const f = imap.fetch(results, { bodies: '', struct: true });

            f.on('message', (msg, seqno) => {
              let rawEmail = '';

              msg.on('body', (stream) => {
                const nodeStream = stream as unknown as Stream;

                nodeStream.on('data', (chunk) => {
                  rawEmail += chunk.toString('utf-8');
                });

                nodeStream.on('end', async () => {
                  this.logger.log(`✅ Capturado email ${seqno}`);
                  emails.push(rawEmail);
                });
              });

              msg.once('attributes', (attrs) => {
                // Marcar el mail como leído
                imap.addFlags(attrs.uid, '\\Seen', (err) => {
                  if (err) {
                    this.logger.error(`Error marcando email ${seqno} como leído:`, err);
                  }
                });
              });
            });

            f.once('error', err => {
              this.logger.error('Error en fetch:', err);
              imap.end();
              reject(err);
            });

            f.once('end', () => {
              this.logger.log(`📦 Capturados ${emails.length} emails.`);
              imap.end();
              resolve(emails);
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

  async sendEmail(qrCodeBase64: string, to: string) {
    const user = process.env.GMAIL_USER;
    const password = process.env.GMAIL_APP_PASSWORD;

    if (!user || !password) {
      throw new Error('GMAIL_USER or GMAIL_APP_PASSWORD is missing in .env');
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user,
        pass: password,
      },
    });

    const mailOptions = {
      from: `"ZK-Access" <${user}>`,
      to,
      subject: 'Your ZK-Access QR Code',
      html: `
        <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 300px;">
          <p style="margin-bottom: 20px;">Here is your QR Code to access the event or service:</p>
          <div style="width: 250px; height: 250px; display: flex; justify-content: center; align-items: center;">
            <img src="cid:qrcode" style="width: 100%; height: 100%; object-fit: contain;" />
          </div>
        </div>
      `,
      attachments: [
        {
          filename: 'qrcode.png',
          content: Buffer.from(qrCodeBase64, 'base64'), // 📎 lo arma desde el base64
          cid: 'qrcode', // 👈 este cid es el que embebe la imagen en el HTML
        },
      ],
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      this.logger.log(`📤 Email enviado correctamente: ${info.messageId}`);
    } catch (error) {
      this.logger.error('❌ Error enviando el email:', error);
      throw new Error('Failed to send email');
    }
  }

}
