export class VerifyProofsDto {
    zkEmailProof: any;
    zkPassportProof: {
      firstname: string,
      lastname: string,
      birthdate: string,
      nationality: string,
      documentType: string,
      documentNumber: string,
    };
  }