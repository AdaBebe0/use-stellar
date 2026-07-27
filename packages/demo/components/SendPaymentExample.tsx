import { useSendPayment } from "use-stellar"

export function SendPaymentExample() {
  const { send, loading, error, result } = useSendPayment()

  const handleSend = async () => {
    try {
      // Triggering the payment action with all required/common configuration
      await send({
        to: "GAIH3ULLFQ4DGSECF2AR555KZ4KNDGEKN4AFI4SU2M7B43MGK3QJZNSR",
        asset: "XLM",
        amount: "1.5",
        memo: "Sample payment",
      })
    } catch (err) {
      // Errors can be caught here, or read directly from the `error` state property.
      console.error("Payment failed:", err)
    }
  }

  return (
    <div>
      {/* Triggering payment action & handling loading state */}
      <button onClick={handleSend} disabled={loading}>
        {loading ? "Sending..." : "Send 1.5 XLM"}
      </button>

      {/* Handling success response */}
      {result?.status === "success" && (
        <p style={{ color: "green" }}>
          Success! Transaction Hash: <code>{result.hash}</code>
        </p>
      )}

      {/* Handling errors/failures */}
      {error && <p style={{ color: "red" }}>Payment failed: {error.message}</p>}
    </div>
  )
}
