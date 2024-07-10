const StatTable = () => {
  return (
    <div className="overflow-x-auto mt-5">
      <table className="table">
        {/* head */}
        <thead>
          <tr className="text-lg">
            <th></th>
            <th>Тип</th>
            <th>Количество</th>
          </tr>
        </thead>
        <tbody className="text-lg">
          {/* row 1 */}
          <tr className="hover">
            <th>1</th>
            <td>Техучеты</td>
            <td>0</td>
          </tr>
          {/* row 2 */}
          <tr className="hover">
            <th>2</th>
            <td>Техучеты не под напряжением</td>
            <td>0</td>
          </tr>
          {/* row 3 */}
          <tr className="hover">
            <th>3</th>
            <td>БЫТ</td>
            <td>0</td>
          </tr>
          {/* row 4 */}
          <tr className="hover">
            <th>4</th>
            <td>ОДПУ в Пирамиде 2</td>
            <td>0</td>
          </tr>
          {/* row 5 */}
          <tr className="hover">
            <th>5</th>
            <td>ОДПУ в Sims</td>
            <td>0</td>
          </tr>
          {/* row 6 */}
          <tr className="hover">
            <th>6</th>
            <td>ЮР в Пирамиде 2</td>
            <td>0</td>
          </tr>
          {/* row 7 */}
          <tr className="hover">
            <th>7</th>
            <td>ЮР в Sims</td>
            <td>0</td>
          </tr>
          {/* row 8 */}
          <tr className="hover">
            <th>8</th>
            <td>БЫТ вышедшие из строя</td>
            <td>0</td>
          </tr>
          {/* row 9 */}
          <tr className="hover">
            <th>9</th>
            <td>ОДПУ вышедшие из строя П2</td>
            <td>0</td>
          </tr>
          {/* row 10 */}
          <tr className="hover">
            <th>10</th>
            <td>ОДПУ вышедшие из строя SIMS</td>
            <td>0</td>
          </tr>
          {/* row 11 */}
          <tr className="hover">
            <th>11</th>
            <td>ЮР вышедшие из строя П2</td>
            <td>0</td>
          </tr>
          {/* row 12 */}
          <tr className="hover">
            <th>12</th>
            <td>ЮР вышедшие из строя SIMS</td>
            <td>0</td>
          </tr>
          {/* row 13 */}
          <tr className="hover">
            <th>13</th>
            <td>ЮР не отключенные</td>
            <td>0</td>
          </tr>
          {/* row 14 */}
          <tr className="hover">
            <th>14</th>
            <td>Всего коммерческих ПУ</td>
            <td>0</td>
          </tr>
          {/* row 15 */}
          <tr className="hover">
            <th>15</th>
            <td>Всего коммерческих ПУ в работе</td>
            <td>0</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default StatTable;
