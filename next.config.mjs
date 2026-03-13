/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/dashboard/event/:id/roster',
        destination: '/dashboard/event/:id/signups',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
