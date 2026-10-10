import { createFileRoute } from '@tanstack/react-router';
import { pageHead } from '@/lib/noir-data';
import { Intro,NextChapter } from '@/components/noir/site-shell';
import { Gallery } from '@/components/noir/gallery';
export const Route=createFileRoute('/gallery')({head:()=>pageHead('The visual world','A curated concept gallery of sculptural nails, expressive makeup, luminous skin and bold hair.'),component:GalleryPage});
function GalleryPage(){return <><Intro eyebrow="THE NOIR PINK EDIT" title="EXPRESSION. UNFILTERED." copy="A visual world where individuality takes the spotlight."/><div className="page-content"><Gallery/></div><NextChapter/></>}
