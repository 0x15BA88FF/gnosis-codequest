declare module '@paystack/inline-js' {
  interface PaystackSuccess {
    reference: string;
    status: string;
    message: string;
    trans: string;
    transaction: string;
    trxref: string;
  }

  interface PaystackPopup {
    resumeTransaction(
      accessCode: string,
      callbacks: {
        onSuccess?: (response: PaystackSuccess) => void;
        onCancel?: () => void;
        onLoad?: (response: any) => void;
        onElementsMount?: (elements: any) => void;
      }
    ): void;
    preloadTransaction(config: any): () => void;
  }

  interface PaystackPopStatic {
    new (): PaystackPopup;
    setup(config: any): { openIframe(): void };
  }

  const PaystackPop: PaystackPopStatic;
  export default PaystackPop;
}
