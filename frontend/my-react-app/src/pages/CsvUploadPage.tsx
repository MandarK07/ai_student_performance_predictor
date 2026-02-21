import Upload from "../components/Upload";

export default function CsvUploadPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">CSV Upload</h1>
        <p className="text-sm text-slate-500">Upload real student CSV records and run batch predictions from the database pipeline.</p>
      </div>
      <Upload />
    </div>
  );
}
