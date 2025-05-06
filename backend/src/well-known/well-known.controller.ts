// src/well-known/well-known.controller.ts
import { Controller, Get, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Controller('.well-known')
export class WellKnownController {
  private readonly logger = new Logger(WellKnownController.name);
  private readonly baseUrl: string;
  private readonly zkAccess: any;

  constructor(private configService: ConfigService) {
    this.baseUrl = this.configService.get<string>('BASE_URL')!;
  
    this.zkAccess = {
      id: "ZKAccess",
      format: "jwt_vc",
      types: ["VerifiableCredential", "ZKAccess"],
      display: [
        {
          name: "ZK-Access",
          locale: "en-US",
          logo: {
            url: this.baseUrl + "/logo.png",
            alt_text: "Logo",
          },
          background_image: {
            url: this.baseUrl + "/background.png",
            alt_text: "Card",
          },
          text_color: "#FFFFFF"
        },
      ],
      credentialSubject: {
        organization: {
          display: [{ name: "Organization", locale: "en-US" }],
        },
        email: {
          display: [{ name: "Email Address", locale: "en-US" }],
        },
        role: {
          display: [{ name: "Role", locale: "en-US" }],
        },
        firstname: {
          display: [{ name: "First Name", locale: "en-US" }],
        },
        lastname: {
          display: [{ name: "Last Name", locale: "en-US" }],
        },
        birthdate: {
          display: [{ name: "Birthdate", locale: "en-US" }],
        },
        nationality: {
          display: [{ name: "Nationality", locale: "en-US" }],
        },
        documentType: {
          display: [{ name: "Document Type", locale: "en-US" }],
        },
        documentNumber: {
          display: [{ name: "Document Number", locale: "en-US" }],
        },
      },
      zkBindings: {
        signer: {
          display: [{ name: "Signer", locale: "en-US" }],
        },
        credentialSubject: {
          organization: {
            hash: {
              display: [{ name: "Organization Hash", locale: "en-US" }],
            },
            signature: {
              display: [{ name: "Organization Signature", locale: "en-US" }],
            }
          },
          email: {
            hash: {
              display: [{ name: "Email Hash", locale: "en-US" }],
            },
            signature: {
              display: [{ name: "Email Signature", locale: "en-US" }],
            }
          },
          role: {
            hash: {
              display: [{ name: "Role Hash", locale: "en-US" }],
            },
            signature: {
              display: [{ name: "Role Signature", locale: "en-US" }],
            }
          },
          firstname: {
            hash: {
              display: [{ name: "First Name Hash", locale: "en-US" }],
            },
            signature: {
              display: [{ name: "First Name Signature", locale: "en-US" }],
            }
          },
          lastname: {
            hash: {
              display: [{ name: "Last Name Hash", locale: "en-US" }],
            },
            signature: {
              display: [{ name: "Last Name Signature", locale: "en-US" }],
            }
          },
          birthdate: {
            hash: {
              display: [{ name: "Birthdate Hash", locale: "en-US" }],
            },
            signature: {
              display: [{ name: "Birthdate Signature", locale: "en-US" }],
            }
          },
          nationality: {
            hash: {
              display: [{ name: "Nationality Hash", locale: "en-US" }],
            },
            signature: {
              display: [{ name: "Nationality Signature", locale: "en-US" }],
            }
          },
          documentType: {
            hash: {
              display: [{ name: "Document Type Hash", locale: "en-US" }],
            },
            signature: {
              display: [{ name: "Document Type Signature", locale: "en-US" }],
            }
          },
          documentNumber: {
            hash: {
              display: [{ name: "Document Number Hash", locale: "en-US" }],
            },
            signature: {
              display: [{ name: "Document Number Signature", locale: "en-US" }],
            }
          }
        }
      }
    };
  }
  
  
  @Get('oauth-authorization-server')
  getOauthMetadata() {
    this.logger.log("Reviso config oauth-authorization-server");
    return {
      issuer: this.baseUrl,
      authorization_endpoint: `${this.baseUrl}/authorize`,
      token_endpoint: `${this.baseUrl}/oauth2/token`,
      jwks_uri: `${this.baseUrl}/.well-known/jwks.json`,
      response_types_supported: ["code"],
      grant_types_supported: [
        "authorization_code",
        "urn:ietf:params:oauth:grant-type:pre-authorized_code"
      ],
      token_endpoint_auth_methods_supported: ["none"],
      code_challenge_methods_supported: ["S256"]
    };
  }

  @Get('openid-credential-issuer')
  getOpenidCredentialIssuer() {
    this.logger.log("Reviso config openid-credential-issuer");
    return {
      credential_issuer: this.baseUrl,
      authorization_server: this.baseUrl,
      token_endpoint: `${this.baseUrl}/oauth2/token`,
      credential_endpoint: `${this.baseUrl}/credential`,
      display: [{
        name: "ZK-Access",
        locale: "en-US",
      }],
      credentials_supported: [this.zkAccess]
    };
  }
}
