import { CategoriesSections } from "@/modules/categories/ui/sections/categories-section";
import { ResultsSection } from "../sections/results-section";

interface Props {
  query?: string;
  categoryId?: string;
}

export const SearchView = (props: Props) => {
  return (
    <div className="max-w-[1300px] mx-auto mb-10 flex flex-col gap-y-6 px-4 pt-2.5">
      <CategoriesSections categoryId={props.categoryId} />
      <ResultsSection {...props} />
    </div>
  );
};
