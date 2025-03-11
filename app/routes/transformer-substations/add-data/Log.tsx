type LogMessages = {
  logMessages: {
    id: number;
    message: string;
  }[];
};

export default function Log({ logMessages }: LogMessages) {
  return (
    <section className="w-96">
      {logMessages.length > 0 && (
        <div className="bg-base-100 border-base-300 collapse border">
          <input type="checkbox" className="peer" />
          <div
            className="collapse-title bg-primary text-primary-content
                peer-checked:bg-secondary peer-checked:text-secondary-content"
          >
            Нажмите, чтобы показать/скрыть лог
          </div>
          <div
            className="collapse-content bg-primary text-primary-content
                peer-checked:bg-secondary peer-checked:text-secondary-content"
          >
            <ul>
              {logMessages.map((message) => (
                <li key={message.id}>{message.message}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}
