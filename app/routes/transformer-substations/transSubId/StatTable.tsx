interface StatTableProps {
  data: {
    privateMeters: DbData;
    legalSims: DbData;
    legalP2: DbData;
    odpySims: DbData;
    odpyP2: DbData;
    techMeters: {
      quantity: number;
      underVoltage: number;
    };
  };
}

export default function StatTable({ data }: StatTableProps) {
  const privateTotal =
    data.privateMeters.inSystem + data.privateMeters.notInSystem;

  const legalSimsTotal = data.legalSims.inSystem + data.legalSims.notInSystem;
  const legalP2Total = data.legalP2.inSystem + data.legalP2.notInSystem;
  const odpySimsTotal = data.odpySims.inSystem + data.odpySims.notInSystem;
  const odpyP2Total = data.odpyP2.inSystem + data.odpyP2.notInSystem;

  const totalMeters =
    privateTotal + legalSimsTotal + legalP2Total + odpySimsTotal + odpyP2Total;

  const inSystemTotal =
    data.privateMeters.inSystem +
    data.legalSims.inSystem +
    data.legalP2.inSystem +
    data.odpySims.inSystem +
    data.odpyP2.inSystem;

  return (
    <div className="overflow-auto max-h-[50vh] mt-5 mb-5">
      <table className="table">
        <thead className="sticky top-0 bg-base-200">
          <tr className="text-lg">
            <th></th>
            <th>Тип</th>
            <th>Количество</th>
          </tr>
        </thead>

        <tbody className="text-lg">
          <tr className="hover:bg-base-300">
            <th>1</th>
            <td>Техучеты</td>
            <td>{data.techMeters.quantity}</td>
          </tr>

          <tr className="hover:bg-base-300">
            <th>2</th>
            <td>Техучеты не под напряжением</td>
            <td>{data.techMeters.quantity - data.techMeters.underVoltage}</td>
          </tr>

          <tr className="hover:bg-base-300">
            <th>3</th>
            <td>БЫТ всего</td>
            <td>{privateTotal}</td>
          </tr>

          <tr className="hover:bg-base-300">
            <th>4</th>
            <td>БЫТ в системе</td>
            <td>{data.privateMeters.inSystem}</td>
          </tr>

          <tr className="hover:bg-base-300">
            <th>6</th>
            <td>ЮР Sims всего</td>
            <td>{legalSimsTotal}</td>
          </tr>

          <tr className="hover:bg-base-300">
            <th>7</th>
            <td>ЮР Sims в системе</td>
            <td>{data.legalSims.inSystem}</td>
          </tr>

          <tr className="hover:bg-base-300">
            <th>9</th>
            <td>ЮР П2 всего</td>
            <td>{legalP2Total}</td>
          </tr>

          <tr className="hover:bg-base-300">
            <th>10</th>
            <td>ЮР П2 в системе</td>
            <td>{data.legalP2.inSystem}</td>
          </tr>

          <tr className="hover:bg-base-300">
            <th>13</th>
            <td>ОДПУ Sims всего</td>
            <td>{odpySimsTotal}</td>
          </tr>

          <tr className="hover:bg-base-300">
            <th>14</th>
            <td>ОДПУ Sims в системе</td>
            <td>{data.odpySims.inSystem}</td>
          </tr>

          <tr className="hover:bg-base-300">
            <th>16</th>
            <td>ОДПУ П2 всего</td>
            <td>{odpyP2Total}</td>
          </tr>

          <tr className="hover:bg-base-300">
            <th>16</th>
            <td>ОДПУ П2 в системе</td>
            <td>{data.odpyP2.inSystem}</td>
          </tr>

          <tr className="hover:bg-base-300">
            <th>18</th>
            <td>Всего коммерческих ПУ</td>
            <td>{totalMeters}</td>
          </tr>

          <tr className="hover:bg-base-300">
            <th>19</th>
            <td>Всего коммерческих ПУ в работе</td>
            <td>{inSystemTotal}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
