function ErrorMessage({
  message,
  onRetry
}) {
  return (
    <>
      <h3>{message}</h3>

      <button onClick={onRetry}>
        Retry
      </button>
    </>
  );
}

export default ErrorMessage;