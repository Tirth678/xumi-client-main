import FeaturesWithPanel from "@/components/ui/features-with-panel";
import { XUMI_FEATURES, XUMI_GALLERY } from "@/data/productCatalog";

const items = XUMI_FEATURES.slice(0, 6).map((title, index) => ({
  title,
  content: XUMI_GALLERY[index],
  alt: `XUMI — ${title}`,
}));

export default function FeaturesSection() {
  return (
    <FeaturesWithPanel items={items}>
      <p className="mt-6 px-4 font-body text-sm text-muted-foreground">
        Also includes {XUMI_FEATURES[6]}.
      </p>
    </FeaturesWithPanel>
  );
}
