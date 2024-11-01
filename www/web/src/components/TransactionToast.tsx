import { web3 } from "@coral-xyz/anchor";
import { useConnection } from "@solana/wallet-adapter-react";

import { Id, toast } from "react-toastify";
import { MdArrowOutward } from "react-icons/md";
import { useCallback, useEffect, useRef, useState } from "react";

import { Explorer } from "../web3/link";

type TransactionToastMessageProps = {
  message: string;
  signature: string;
};

function TransactionToastMessage({
  message,
  signature,
}: TransactionToastMessageProps) {
  return (
    <div className="flex flex-col text-sm space-y-2">
      <p>{message}</p>
      <a
        href={Explorer.buildTx(signature)}
        target="_black"
        className="flex items-center text-xs underline underline-dashed space-x-2"
      >
        <span>View in explorer</span>
        <MdArrowOutward />
      </a>
    </div>
  );
}

type TransactionToastProps = {
  toastId: Id;
  signature: string;
  callback?: (status: web3.TransactionConfirmationStatus | "error") => void;
};

export default function TransactionToast({
  toastId,
  signature,
  callback,
}: TransactionToastProps) {
  const { connection } = useConnection();

  const [status, setStatus] = useState<
    [number, web3.TransactionConfirmationStatus | "error"]
  >([0, "confirmed"]);
  const fragment = useRef<HTMLDivElement | null>(null);

  const signatureListener = useCallback(() => {
    const subId = connection.onSignature(signature, async ({ err }) => {
      if (err) {
        toast.update(toastId, {
          render: "Error subscribing to tx signature",
          type: "error",
          isLoading: false,
        });
        if (callback) callback("error");

        return connection.removeSignatureListener(subId);
      }

      const { value } = await connection.getSignatureStatus(signature);

      if (value && value.confirmationStatus) {
        if (callback) callback(value.confirmationStatus);

        switch (value.confirmationStatus) {
          case "processed":
            toast.update(toastId, {
              isLoading: true,
              type: "info",
              render: (
                <TransactionToastMessage
                  message={`Transaction onchain. \n ${value.confirmations} confirmations`}
                  signature={signature}
                />
              ),
            });
            setStatus([value.confirmations!, value.confirmationStatus]);

            break;
          case "confirmed":
            toast.update(toastId, {
              type: "success",
              autoClose: 5000,
              render: (
                <TransactionToastMessage
                  message={`Transaction confirmed. \n ${
                    value.confirmations ?? "Max"
                  } confirmations`}
                  signature={signature}
                />
              ),
            });
            setStatus([value.confirmations!, value.confirmationStatus]);

            break;
          case "finalized":
            toast.update(toastId, {
              isLoading: false,
              autoClose: 5000,
              type: "success",
              render: (
                <TransactionToastMessage
                  message={`Transaction finalized`}
                  signature={signature}
                />
              ),
            });
            setStatus(status);
        }
      }
    });

    return () => {
      connection.removeSignatureListener(subId);
    };
  }, [status, signature, fragment, connection]);

  useEffect(() => {
    return signatureListener();
  }, [status, signatureListener]);

  return <div ref={fragment} />;
}
