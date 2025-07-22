interface LogProps {
  actionLogs: {
    id: number;
    message: string;
  }[];
}

export default function Log({ actionLogs }: LogProps) {
  return (
    <section className="max-w-fit">
      {actionLogs.length > 0 && (
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
              {actionLogs.map((log) => (
                <li key={log.id}>{log.message}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}
