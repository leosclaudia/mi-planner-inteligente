import { createFileRoute } from "@tanstack/react-router";
import { AppGate } from "@/components/planner/AppGate";
import { PageShell } from "@/components/planner/PageShell";
import { FlexibleNotes } from "@/components/planner/FlexibleNotes";
import { useLanguage } from "@/lib/language";
export const Route=createFileRoute("/notas-fecha")({component:()=> <AppGate><DatedNotes/></AppGate>});
function DatedNotes(){const{lang}=useLanguage();return <PageShell title={lang==="en"?"Dated notes":"Notas con fecha"} subtitle={lang==="en"?"Independent notes you can reorder":"Notas independientes que podés mover y ordenar"}><FlexibleNotes/></PageShell>}
