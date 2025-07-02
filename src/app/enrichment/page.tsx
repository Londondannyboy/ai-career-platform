import { ApifyCompanyEnrichment } from '@/components/ApifyCompanyEnrichment';

export default function EnrichmentPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <ApifyCompanyEnrichment />
    </div>
  );
}

export const metadata = {
  title: 'Company Enrichment - Quest',
  description: 'Deep LinkedIn intelligence powered by Apify HarvestAPI scraping',
};