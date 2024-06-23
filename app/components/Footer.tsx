const Footer = () => {
  return (
    <footer
      className="footer footer-center bg-base-300 text-base-content
      p-4 col-span-5 row-start-5 border-t-2 border-neutral"
    >
      <aside>
        <p>Copyright © ${new Date().getFullYear()} - Згода Владислав Геннадьевич</p>
      </aside>
    </footer>
  )
};

export default Footer;
