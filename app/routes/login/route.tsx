export default function Login() {
  return (
    <div className="card bg-base-100 w-full max-w-sm shrink-0 shadow-2xl">
      <form className="card-body">
        <div className="form-control">
          <label htmlFor="login" className="label">
            <span className="label-text">Логин</span>
          </label>
          <input
            type="text"
            placeholder="логин"
            className="input input-bordered"
            id="login"
            required />
        </div>
        <div className="form-control">
          <label htmlFor="password" className="label">
            <span className="label-text">Пароль</span>
          </label>
          <input
            type="password"
            placeholder="пароль"
            className="input input-bordered"
            id="password"
            required />
        </div>
        <div className="form-control mt-6">
          <button className="btn btn-primary">Войти</button>
        </div>
      </form>
    </div>
  );
}
