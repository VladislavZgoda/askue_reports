export default function StatTable() {
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
            <td>0</td>
          </tr>

          <tr className="hover">
            <th>2</th>
            <td>Техучеты не под напряжением</td>
            <td>0</td>
          </tr>

          <tr className="hover">
            <th>3</th>
            <td>БЫТ всего</td>
            <td>0</td>
          </tr>

          <tr className="hover">
            <th>4</th>
            <td>БЫТ в системе</td>
            <td>0</td>
          </tr>

          <tr className="hover">
            <th>5</th>
            <td>БЫТ вышедшие из строя</td>
            <td>0</td>
          </tr>

          <tr className="hover">
            <th>6</th>
            <td>ЮР Sims всего</td>
            <td>0</td>
          </tr>

          <tr className="hover">
            <th>7</th>
            <td>ЮР Sims в системе</td>
            <td>0</td>
          </tr>

          <tr className="hover">
            <th>8</th>
            <td>ЮР SIMS вышедшие из строя</td>
            <td>0</td>
          </tr>

          <tr className="hover">
            <th>9</th>
            <td>ЮР П2 всего</td>
            <td>0</td>
          </tr>

          <tr className="hover">
            <th>10</th>
            <td>ЮР П2 в системе</td>
            <td>0</td>
          </tr>

          <tr className="hover">
            <th>11</th>
            <td>ЮР П2 вышедшие из строя</td>
            <td>0</td>
          </tr>

          <tr className="hover">
            <th>12</th>
            <td>ЮР П2 отключенные</td>
            <td>0</td>
          </tr>

          <tr className="hover">
            <th>13</th>
            <td>ОДПУ Sims всего</td>
            <td>0</td>
          </tr>

          <tr className="hover">
            <th>14</th>
            <td>ОДПУ Sims в системе</td>
            <td>0</td>
          </tr>

          <tr className="hover">
            <th>15</th>
            <td>ОДПУ SIMS вышедшие из строя</td>
            <td>0</td>
          </tr>

          <tr className="hover">
            <th>16</th>
            <td>ОДПУ П2 всего</td>
            <td>0</td>
          </tr>

          <tr className="hover">
            <th>16</th>
            <td>ОДПУ П2 в системе</td>
            <td>0</td>
          </tr>

          <tr className="hover">
            <th>17</th>
            <td>ОДПУ П2 вышедшие из строя</td>
            <td>0</td>
          </tr>

          <tr className="hover">
            <th>18</th>
            <td>Всего коммерческих ПУ</td>
            <td>0</td>
          </tr>

          <tr className="hover">
            <th>19</th>
            <td>Всего коммерческих ПУ в работе</td>
            <td>0</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
