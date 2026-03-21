import { getSiteData } from '../lib/api'
import UrbanBistroHome  from '../templates/urban-bistro/HomePage'
import NoirFineDineHome from '../templates/noir-fine-dine/HomePage'
import GardenFreshHome  from '../templates/garden-fresh/HomePage'

const TEMPLATES = {
  'urban-bistro':  UrbanBistroHome,
  'noir-fine-dine': NoirFineDineHome,
  'garden-fresh':  GardenFreshHome,
}

export async function getStaticProps() {
  const data     = await getSiteData()
  // Read template from saved config, fallback to env var, fallback to urban-bistro
  const template = data.colours?.theme
    || process.env.SITE_TEMPLATE
    || 'urban-bistro'
  return {
    props:      { data, template, colours: data.colours || null },
    revalidate: 60
  }
}

export default function HomePage({ data, template }) {
  const Template = TEMPLATES[template] || UrbanBistroHome
  return <Template data={data}/>
}