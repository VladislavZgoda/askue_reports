interface TabPanelProps {
  children: React.ReactNode;
  label: string;
  checked?: boolean;
}

export default function TabPanel({
  children,
  label,
  checked = false,
}: TabPanelProps) {
  return (
    <>
      <input
        type="radio"
        name="my_tabs_2"
        role="tab"
        className="tab"
        aria-label={label}
        defaultChecked={checked}
      />
      <div
        role="tabpanel"
        className="tab-content bg-base-100 border-base-300 rounded-box p-6"
      >
        {children}
      </div>
    </>
  );
}
