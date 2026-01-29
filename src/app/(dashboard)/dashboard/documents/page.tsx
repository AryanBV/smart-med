import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDocuments } from "@/actions/documents";
import { getFamilyMembers } from "@/actions/family";
import { DocumentList } from "@/components/documents/document-list";
import { DocumentPagination } from "@/components/documents/document-pagination";

export const metadata = {
  title: "Documents | smart-med",
  description: "Manage your prescription documents",
};

interface DocumentsPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function DocumentsPage({
  searchParams,
}: DocumentsPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const params = await searchParams;
  const currentPage = Math.max(1, parseInt(params.page || "1", 10));
  const pageSize = 20;

  const [documentsResult, membersResult] = await Promise.all([
    getDocuments(currentPage, pageSize),
    getFamilyMembers(),
  ]);

  if (documentsResult.error || membersResult.error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
          <p className="text-muted-foreground">
            Manage your prescription documents
          </p>
        </div>
        <div className="text-red-600 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 p-4 rounded-lg">
          <p className="font-medium">Error loading data</p>
          <p className="text-sm mt-1">
            {documentsResult.error || membersResult.error}
          </p>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(documentsResult.totalCount / pageSize);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
        <p className="text-muted-foreground">
          Upload and manage prescription documents for your family
          {documentsResult.totalCount > 0 && (
            <span className="ml-2 text-sm">
              ({documentsResult.totalCount} total)
            </span>
          )}
        </p>
      </div>

      <DocumentList
        documents={documentsResult.data}
        familyMembers={membersResult.data}
      />

      {totalPages > 1 && (
        <DocumentPagination
          currentPage={currentPage}
          totalPages={totalPages}
          hasMore={documentsResult.hasMore}
        />
      )}
    </div>
  );
}
