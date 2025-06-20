interface MeterRegistrationStats {
  registeredMeterCount: number;
  unregisteredMeterCount: number;
}

interface TechnicalMeterStats {
  quantity: number;
  underVoltage: number;
}

interface MeterSummaryData {
  privateMeters: MeterRegistrationStats;
  legalSimsMeters: MeterRegistrationStats;
  legalP2Meters: MeterRegistrationStats;
  odpuSimsMeters: MeterRegistrationStats;
  odpuP2Meters: MeterRegistrationStats;
  technicalMeters: TechnicalMeterStats;
}

interface StatTableProps {
  summary: MeterSummaryData;
}

export default function StatTable({ summary }: StatTableProps) {
  const {
    privateMeters,
    legalSimsMeters,
    legalP2Meters,
    odpuSimsMeters,
    odpuP2Meters,
    technicalMeters,
  } = summary;

  const privateTotal =
    privateMeters.registeredMeterCount + privateMeters.unregisteredMeterCount;

  const legalSimsTotal =
    legalSimsMeters.registeredMeterCount +
    legalSimsMeters.unregisteredMeterCount;

  const legalP2Total =
    legalP2Meters.registeredMeterCount + legalP2Meters.unregisteredMeterCount;

  const odpuSimsTotal =
    odpuSimsMeters.registeredMeterCount + odpuSimsMeters.unregisteredMeterCount;

  const odpuP2Total =
    odpuP2Meters.registeredMeterCount + odpuP2Meters.unregisteredMeterCount;

  const metersTotal =
    privateTotal + legalSimsTotal + legalP2Total + odpuSimsTotal + odpuP2Total;

  const registeredMeterTotal =
    privateMeters.registeredMeterCount +
    legalSimsMeters.registeredMeterCount +
    legalP2Meters.registeredMeterCount +
    odpuSimsMeters.registeredMeterCount +
    odpuP2Meters.registeredMeterCount;

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
            <td>{technicalMeters.quantity}</td>
          </tr>

          <tr className="hover:bg-base-300">
            <th>2</th>
            <td>Техучеты не под напряжением</td>
            <td>{technicalMeters.quantity - technicalMeters.underVoltage}</td>
          </tr>

          <tr className="hover:bg-base-300">
            <th>3</th>
            <td>БЫТ всего</td>
            <td>{privateTotal}</td>
          </tr>

          <tr className="hover:bg-base-300">
            <th>4</th>
            <td>БЫТ в системе</td>
            <td>{privateMeters.registeredMeterCount}</td>
          </tr>

          <tr className="hover:bg-base-300">
            <th>6</th>
            <td>ЮР Sims всего</td>
            <td>{legalSimsTotal}</td>
          </tr>

          <tr className="hover:bg-base-300">
            <th>7</th>
            <td>ЮР Sims в системе</td>
            <td>{legalSimsMeters.registeredMeterCount}</td>
          </tr>

          <tr className="hover:bg-base-300">
            <th>9</th>
            <td>ЮР П2 всего</td>
            <td>{legalP2Total}</td>
          </tr>

          <tr className="hover:bg-base-300">
            <th>10</th>
            <td>ЮР П2 в системе</td>
            <td>{legalP2Meters.registeredMeterCount}</td>
          </tr>

          <tr className="hover:bg-base-300">
            <th>13</th>
            <td>ОДПУ Sims всего</td>
            <td>{odpuSimsTotal}</td>
          </tr>

          <tr className="hover:bg-base-300">
            <th>14</th>
            <td>ОДПУ Sims в системе</td>
            <td>{odpuSimsMeters.registeredMeterCount}</td>
          </tr>

          <tr className="hover:bg-base-300">
            <th>16</th>
            <td>ОДПУ П2 всего</td>
            <td>{odpuP2Total}</td>
          </tr>

          <tr className="hover:bg-base-300">
            <th>16</th>
            <td>ОДПУ П2 в системе</td>
            <td>{odpuP2Meters.registeredMeterCount}</td>
          </tr>

          <tr className="hover:bg-base-300">
            <th>18</th>
            <td>Всего коммерческих ПУ</td>
            <td>{metersTotal}</td>
          </tr>

          <tr className="hover:bg-base-300">
            <th>19</th>
            <td>Всего коммерческих ПУ в работе</td>
            <td>{registeredMeterTotal}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
