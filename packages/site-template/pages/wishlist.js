import WishlistPage from '../templates/theme-d3/WishlistPage';

export default function Wishlist({ data, page }) {
  return <WishlistPage data={data} page={page} />;
}

export async function getServerSideProps(context) {
  const { site } = context.query;
  const API_URL = process.env.NEXT_PUBLIC_CMS_API_URL || 'http://localhost:3001/api';

  try {
    const response = await fetch(`${API_URL}/clients/${site}/export`);
    if (!response.ok) {
      throw new Error('Failed to fetch data');
    }
    const data = await response.json();
    return {
      props: {
        data,
        page: {}
      }
    };
  } catch (error) {
    console.error('Error fetching wishlist data:', error);
    return {
      props: {
        data: {},
        page: {}
      }
    };
  }
}
