import { Link } from "react-router-dom";
export default function Section({ title, subtitle, to, children }) {
  return <section className="py-12"><div className="container-app"><div className="mb-6 flex items-end justify-between gap-4"><div><h2 className="text-2xl font-black md:text-3xl">{title}</h2>{subtitle && <p className="mt-1 text-slate-500">{subtitle}</p>}</div>{to && <Link className="font-bold underline" to={to}>See all</Link>}</div>{children}</div></section>;
}
