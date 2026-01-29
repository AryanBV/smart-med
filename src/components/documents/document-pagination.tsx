"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface DocumentPaginationProps {
  currentPage: number;
  totalPages: number;
  hasMore: boolean;
}

export function DocumentPagination({
  currentPage,
  totalPages,
  hasMore,
}: DocumentPaginationProps) {
  const pathname = usePathname();

  return (
    <div className="flex items-center justify-between border-t pt-4">
      <Button
        variant="outline"
        size="sm"
        disabled={currentPage <= 1}
        asChild={currentPage > 1}
        className="min-h-[44px]"
      >
        {currentPage > 1 ? (
          <Link href={`${pathname}?page=${currentPage - 1}`}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Link>
        ) : (
          <>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </>
        )}
      </Button>

      <span className="text-sm text-muted-foreground">
        Page {currentPage} of {totalPages}
      </span>

      <Button
        variant="outline"
        size="sm"
        disabled={!hasMore}
        asChild={hasMore}
        className="min-h-[44px]"
      >
        {hasMore ? (
          <Link href={`${pathname}?page=${currentPage + 1}`}>
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        ) : (
          <>
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </>
        )}
      </Button>
    </div>
  );
}
