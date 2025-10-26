export default function Footer() {
  return (
    <footer className="footer footer-center bg-base-300 text-base-content border-neutral col-span-5 row-start-5 border-t-2 p-4">
      <aside>
        <p>
          Copyright © ${new Date().getFullYear()} - Згода Владислав Геннадьевич
        </p>
      </aside>
    </footer>
  );
}
