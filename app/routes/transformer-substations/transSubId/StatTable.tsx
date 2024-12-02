import type { DbData } from "~/types";

type DataProp = {
  data: {
    private: DbData;
    legalSims: DbData;
    legalP2: DbData;
    odpySims: DbData;
    odpyP2: DbData;
    techMeters: {
      quantity: number;
      underVoltage: number;
    };
  }
};

type ConvertedDataType = {
  [k: string]: { [k: string]: number }
};

export default function StatTable({ data }: DataProp) {
  const privateTotal =
    data.private.inSystem + data.private.notInSystem;

  const legalSimsTotal =
    data.legalSims.inSystem + data.legalSims.notInSystem;

  const legalP2Total =
    data.legalP2.inSystem + data.legalP2.notInSystem;

  const odpySimsTotal =
    data.odpySims.inSystem + data.odpySims.notInSystem;

  const odpyP2Total =
    data.odpyP2.inSystem + data.odpyP2.notInSystem;

  const totalMeters =
    privateTotal + legalSimsTotal + legalP2Total
    + odpySimsTotal + odpyP2Total;

  const convertedData: ConvertedDataType =
    JSON.parse(JSON.stringify(data));

  delete convertedData['techMeters'];

  const reducer = (
    obj: ConvertedDataType, property: string
  ) => {
    return Object
      .keys(obj)
      .reduce(
        (sum, key) => sum + obj[key][property], 0
      );
  };

  const inSystemTotal = reducer(convertedData, 'inSystem');

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
          <tr className="hover">
            <th>1</th>
            <td>Техучеты</td>
            <td>{data.techMeters.quantity}</td>
          </tr>

          <tr className="hover">
            <th>2</th>
            <td>Техучеты не под напряжением</td>
            <td>{data.techMeters.underVoltage}</td>
          </tr>

          <tr className="hover">
            <th>3</th>
            <td>БЫТ всего</td>
            <td>{privateTotal}</td>
          </tr>

          <tr className="hover">
            <th>4</th>
            <td>БЫТ в системе</td>
            <td>{data.private.inSystem}</td>
          </tr>

          <tr className="hover">
            <th>6</th>
            <td>ЮР Sims всего</td>
            <td>{legalSimsTotal}</td>
          </tr>

          <tr className="hover">
            <th>7</th>
            <td>ЮР Sims в системе</td>
            <td>{data.legalSims.inSystem}</td>
          </tr>

          <tr className="hover">
            <th>9</th>
            <td>ЮР П2 всего</td>
            <td>{legalP2Total}</td>
          </tr>

          <tr className="hover">
            <th>10</th>
            <td>ЮР П2 в системе</td>
            <td>{data.legalP2.inSystem}</td>
          </tr>

          <tr className="hover">
            <th>13</th>
            <td>ОДПУ Sims всего</td>
            <td>{odpySimsTotal}</td>
          </tr>

          <tr className="hover">
            <th>14</th>
            <td>ОДПУ Sims в системе</td>
            <td>{data.odpySims.inSystem}</td>
          </tr>

          <tr className="hover">
            <th>16</th>
            <td>ОДПУ П2 всего</td>
            <td>{odpyP2Total}</td>
          </tr>

          <tr className="hover">
            <th>16</th>
            <td>ОДПУ П2 в системе</td>
            <td>{data.odpyP2.inSystem}</td>
          </tr>

          <tr className="hover">
            <th>18</th>
            <td>Всего коммерческих ПУ</td>
            <td>{totalMeters}</td>
          </tr>

          <tr className="hover">
            <th>19</th>
            <td>Всего коммерческих ПУ в работе</td>
            <td>{inSystemTotal}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
