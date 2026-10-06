import { Download, FileText, Loader2 } from "lucide-react";
import Card from "./Card";
import Button from "./Button";

export default function DocumentViewerCard({
  title = "Document",
  url,
  contentType,
  loading,
  onDownload,
  emptyLabel = "Document unavailable",
}) {
  const isImage = contentType?.startsWith("image/");

  return (
    <Card className="p-0 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-outline-variant bg-surface-low">
        <span className="text-xs font-medium text-on-surface-variant">
          {title}
        </span>
        {onDownload && (
          <Button
            variant="ghost"
            size="sm"
            className="p-1.5 shrink-0"
            onClick={onDownload}
          >
            <Download size={14} />
          </Button>
        )}
      </div>

      <div className="w-full overflow-x-auto overflow-y-hidden bg-[#252525]">
        {loading ? (
          <div className="flex items-center justify-center min-h-[400px] bg-surface-low">
            <Loader2 size={24} className="animate-spin text-emerald" />
          </div>
        ) : url && isImage ? (
          <div className="flex items-center justify-center min-h-[400px] p-4">
            <img
              src={url}
              alt={title}
              className="max-w-full max-h-[600px] object-contain"
            />
          </div>
        ) : url ? (
          <div className="w-[900px] max-w-none md:w-[900px]">
            <iframe
              src={url}
              title={title}
              className="block w-full border-0"
              style={{ height: "600px" }}
            />
          </div>
        ) : (
          <div className="p-8 bg-surface-low min-h-[200px] flex items-center justify-center">
            <div className="text-center">
              <FileText size={48} className="text-outline mx-auto mb-3" />
              <p className="text-sm text-on-surface-variant">{emptyLabel}</p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
