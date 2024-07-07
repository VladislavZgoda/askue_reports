const StatRow = (
  {data}
) => {
  console.log(data);


  return (
    <div className="stats shadow row-span-2">
      <div className="stat place-items-center">
        <div className="stat-title">{data.title1}</div>
        <div className="stat-value">{data.value1}</div>
        <div className="stat-desc">{data.date1}</div>
      </div>

      <div className="stat place-items-center">
        <div className="stat-title">{data.title2}</div>
        <div className="stat-value">{data.value2}</div>
        <div className="stat-desc">{data.date2}</div>
      </div>

      <div className="stat place-items-center">
        <div className="stat-title">{data.title3}</div>
        <div className="stat-value">{data.value3}</div>
        <div className="stat-desc">{data.date3}</div>
      </div>

      <div className="stat place-items-center">
        <div className="stat-title">{data.title4}</div>
        <div className="stat-value">{data.value4}</div>
        <div className="stat-desc">{data.date4}</div>
      </div>
    </div>
  );
};

export default StatRow;
