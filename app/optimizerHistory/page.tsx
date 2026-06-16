"use client";

import OptimizerHistoryTable from "@/app/components/OptimizerHistoryTable";
import { bulkRestoreApi, getRestoreJobsApi } from "@/utils/apis/globalApi";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import CruiseControlHistoryTable from "../components/CruiseControlHistoryTable";

type RestoreJob = {
  jobId: string;
  restorableCount: number;
  resource?: string;
  target?: string;
  template?: string;
  totalItems?: number;
  processedItems?: number;
  updateType?: string;
  startedAt?: string;
  completedAt?: string;
  restoreStatus?: string | null;
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function formatResource(resource?: string) {
  if (!resource) return "—";
  const map: Record<string, string> = {
    products: "Product",
    categories: "Category",
    brands: "Brand",
  };
  return map[resource] ?? resource;
}

function formatTarget(target?: string) {
  if (!target) return "—";
  const map: Record<string, string> = {
    title: "Title Tag",
    meta: "Meta Description",
    alt: "Alt Text",
  };
  return map[target] ?? target;
}

export default function OptimizerHistoryPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [restoreJobs, setRestoreJobs] = useState<RestoreJob[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobsError, setJobsError] = useState<string | null>(null);
  const [restoringJobId, setRestoringJobId] = useState<string | null>(null);

  const openRestoreModal = () => {
    setIsModalOpen(true);
  };

  const closeRestoreModal = () => {
    setIsModalOpen(false);
    setJobsError(null);
  };

  const fetchRestoreJobs = async () => {
    try {
      setJobsLoading(true);
      setJobsError(null);
      const response = await getRestoreJobsApi();
      setRestoreJobs(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      setRestoreJobs([]);
      setJobsError(
        error instanceof Error ? error.message : "Failed to load restore jobs",
      );
    } finally {
      setJobsLoading(false);
    }
  };

  useEffect(() => {
    if (isModalOpen) {
      fetchRestoreJobs();
    }
  }, [isModalOpen]);

  const handleBulkRestore = async (jobId: string) => {
    try {
      setRestoringJobId(jobId);
      const response = await bulkRestoreApi(jobId);
      if (response.status) {
        toast.success(response.message ?? "Restore job queued successfully");
        await fetchRestoreJobs();
      } else {
        toast.error(response.message ?? "Failed to queue restore job");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to queue restore job",
      );
    } finally {
      setRestoringJobId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F1F1] p-5 pt-0">
      <Link
        href="/bulkOptimizer"
        className="mb-4 flex items-center gap-1 py-3 text-sm text-[#616161] hover:text-[#303030]"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Back
      </Link>
      <div className="flex items-center gap-2 mb-4">
        <h1 className="text-xl font-bold text-[#303030]">Optimizer History</h1>
        <button
          className="bg-[#000000] text-sm font-medium text-white px-2.5 py-1.5 rounded-md"
          onClick={openRestoreModal}
        >
          Restore
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-md w-full max-w-2xl max-h-[85vh] flex flex-col">
            <div className="p-4 border-b border-[#eeeeee]">
              <h2 className="text-xl font-bold text-[#303030]">Restore Jobs</h2>
              <p className="text-sm text-[#616161] mt-1">
                Select a completed job to restore its items to the previous values.
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {jobsLoading && (
                <p className="text-sm text-[#616161]">Loading restore jobs...</p>
              )}

              {jobsError && (
                <p className="text-sm text-red-600">{jobsError}</p>
              )}

              {!jobsLoading && !jobsError && restoreJobs.length === 0 && (
                <p className="text-sm text-[#616161]">No restorable jobs found.</p>
              )}

              {!jobsLoading && !jobsError && restoreJobs.length > 0 && (
                <div className="flex flex-col gap-3">
                  {restoreJobs.map((job) => (
                    <div
                      key={job.jobId}
                      className="border border-[#e3e3e3] rounded-md p-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="text-sm font-semibold text-[#303030]">
                            {formatResource(job.resource)}
                          </span>
                          <span className="text-xs text-[#616161]">
                            {job.updateType ?? "—"}
                          </span>
                          <span className="text-xs text-[#616161]">
                            {formatTarget(job.target)}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-[#616161]">
                          <p>
                            <span className="font-medium text-[#303030]">Completed:</span>{" "}
                            {formatDateTime(job.completedAt ?? job.startedAt)}
                          </p>
                          <p>
                            <span className="font-medium text-[#303030]">Restorable items:</span>{" "}
                            {job.restorableCount}
                          </p>
                          <p>
                            <span className="font-medium text-[#303030]">Updated items:</span>{" "}
                            {job.processedItems ?? "—"} / {job.totalItems ?? "—"}
                          </p>
                          {job.template && (
                            <p className="sm:col-span-2 truncate" title={job.template}>
                              <span className="font-medium text-[#303030]">Template:</span>{" "}
                              {job.template}
                            </p>
                          )}
                        </div>
                      </div>

                      <button
                        className="bg-[#000000] text-sm font-medium text-white px-3 py-1.5 rounded-md shrink-0 disabled:opacity-50"
                        disabled={restoringJobId === job.jobId || job.restoreStatus === "pending"}
                        onClick={() => handleBulkRestore(job.jobId)}
                      >
                        {restoringJobId === job.jobId ? "Restoring..." : job.restoreStatus === "pending" ? "Restore in progress" : "Restore Job"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-[#eeeeee] flex justify-end">
              <button
                className="bg-[#000000] text-sm font-medium text-white px-2.5 py-1.5 rounded-md"
                onClick={closeRestoreModal}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="card p-0! mb-4">
        <OptimizerHistoryTable onHistoryPage={true} />
      </div>
      <div className="card p-0!">
        <CruiseControlHistoryTable onHistoryPage={true} />
      </div>
    </div>
  );
}
