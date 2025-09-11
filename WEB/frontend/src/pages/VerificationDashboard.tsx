import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { MoreHorizontal, CheckCircle, XCircle } from 'lucide-react';
import apiClient from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

// ✅ Define the Report interface here
interface Report {
  _id: string;
  reporter?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  } | string;
  reporterName?: string;
  reporterContact?: string;
  hazardType: 'tsunami' | 'cyclone' | 'pollution' | 'algae' | 'debris' | 'lightning' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  locationDescription: string;
  description: string;
  mediaUrl?: string;
  mediaPublicId?: string;
  isEmergency: boolean;
  status: 'unverified' | 'verified' | 'rejected';
  verifiedBy?: string;
  createdAt: string;
  updatedAt: string;
}

const fetchUnverifiedReports = async (): Promise<Report[]> =>
  (await apiClient.get('/reports/admin/unverified')).data;

const verifyReport = async (reportId: string) =>
  (await apiClient.put(`/reports/admin/verify/${reportId}`)).data;

const rejectReport = async (reportId: string) =>
  (await apiClient.put(`/reports/admin/reject/${reportId}`)).data;

const VerificationDashboard = () => {
  const queryClient = useQueryClient();
  const { data: reports, isLoading } = useQuery<Report[]>({
    queryKey: ['unverifiedReports'],
    queryFn: fetchUnverifiedReports
  });

  const verifyMutation = useMutation({
    mutationFn: verifyReport,
    onSuccess: () => {
      toast.success("Report verified.");
      queryClient.invalidateQueries({ queryKey: ['unverifiedReports'] });
    },
    onError: () => toast.error("Failed to verify report."),
  });

  const rejectMutation = useMutation({
    mutationFn: rejectReport,
    onSuccess: () => {
      toast.info("Report rejected.");
      queryClient.invalidateQueries({ queryKey: ['unverifiedReports'] });
    },
    onError: () => toast.error("Failed to reject report."),
  });

  if (isLoading) return <div>Loading reports for verification...</div>;

  return (
    <div className="p-8">
      <Card>
        <CardHeader>
          <CardTitle>Verification Dashboard</CardTitle>
          <CardDescription>Review and manage incoming hazard reports.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hazard</TableHead>
                <TableHead>Reporter</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports && reports.length > 0 ? reports.map((report) => (
                <TableRow key={report._id}>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {report.hazardType.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>{report.reporterName || 'Anonymous'}</TableCell>
                  <TableCell>{new Date(report.createdAt).toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <Dialog>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DialogTrigger asChild>
                            <DropdownMenuItem>View Details</DropdownMenuItem>
                          </DialogTrigger>
                          <DropdownMenuItem onClick={() => verifyMutation.mutate(report._id)}>
                            <CheckCircle className="mr-2 h-4 w-4 text-green-500" /> Verify
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => rejectMutation.mutate(report._id)}>
                            <XCircle className="mr-2 h-4 w-4 text-red-500" /> Reject
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Report Details</DialogTitle>
                          <DialogDescription className="capitalize">
                            {report.hazardType.replace('_', ' ')} reported by {report.reporterName || 'Anonymous'}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <p><strong>Description:</strong> {report.description}</p>
                          <p><strong>Location:</strong> {report.location.coordinates[1]}, {report.location.coordinates[0]}</p>
                          {report.mediaUrl && (
                            <div>
                              <strong>Media:</strong>
                              <img src={report.mediaUrl} alt="Hazard media" className="rounded-md mt-2 max-h-64 w-full object-contain" />
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">No pending reports.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default VerificationDashboard;
