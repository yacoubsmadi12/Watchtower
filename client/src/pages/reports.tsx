import DashboardLayout from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, Trash2, Edit, Download, Users, FileText, Shield, 
  Upload, X, Mail, Calendar
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { ReportTemplate, ReportRule, RuleEmployee } from "@shared/schema";
import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface TemplateFormData {
  name: string;
  adminName: string;
  managerEmail: string;
  schedule: string;
}

interface RuleFormData {
  ruleName: string;
  jobDescription: string;
}

interface EmployeeFormData {
  username: string;
  permissions: string;
}

const defaultTemplateForm: TemplateFormData = {
  name: "",
  adminName: "",
  managerEmail: "",
  schedule: "weekly",
};

const defaultRuleForm: RuleFormData = {
  ruleName: "",
  jobDescription: "",
};

const defaultEmployeeForm: EmployeeFormData = {
  username: "",
  permissions: "",
};

export default function ReportsPage() {
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isRuleDialogOpen, setIsRuleDialogOpen] = useState(false);
  const [isEmployeeDialogOpen, setIsEmployeeDialogOpen] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ReportTemplate | null>(null);
  const [editingRule, setEditingRule] = useState<ReportRule | null>(null);
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);
  const [bulkText, setBulkText] = useState("");
  
  const [templateForm, setTemplateForm] = useState<TemplateFormData>(defaultTemplateForm);
  const [ruleForm, setRuleForm] = useState<RuleFormData>(defaultRuleForm);
  const [employeeForm, setEmployeeForm] = useState<EmployeeFormData>(defaultEmployeeForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const { data: templates = [], isLoading: templatesLoading } = useQuery<ReportTemplate[]>({
    queryKey: ["/api/templates"],
  });

  const { data: rules = [] } = useQuery<ReportRule[]>({
    queryKey: ["/api/rules", selectedTemplate],
    queryFn: async () => {
      const response = await fetch(`/api/rules?templateId=${selectedTemplate}`);
      if (!response.ok) throw new Error("Failed to fetch rules");
      return response.json();
    },
    enabled: !!selectedTemplate,
  });

  const { data: allEmployees = [] } = useQuery<RuleEmployee[]>({
    queryKey: ["/api/employees"],
  });

  const invalidateRules = useCallback(() => {
    queryClient.invalidateQueries({ 
      predicate: (query) => {
        const key = query.queryKey;
        return Array.isArray(key) && key[0] === "/api/rules";
      }
    });
  }, []);

  const invalidateEmployees = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
  }, []);

  const createTemplateMutation = useMutation({
    mutationFn: async (data: TemplateFormData) => {
      return apiRequest("POST", "/api/templates", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      setIsTemplateDialogOpen(false);
      setTemplateForm(defaultTemplateForm);
      setFormErrors({});
      toast({ title: "Success", description: "Template created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create template", variant: "destructive" });
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<TemplateFormData> }) => {
      return apiRequest("PUT", `/api/templates/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      setIsTemplateDialogOpen(false);
      setEditingTemplate(null);
      setTemplateForm(defaultTemplateForm);
      setFormErrors({});
      toast({ title: "Success", description: "Template updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update template", variant: "destructive" });
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      invalidateRules();
      invalidateEmployees();
      if (selectedTemplate) setSelectedTemplate(null);
      toast({ title: "Success", description: "Template deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete template", variant: "destructive" });
    },
  });

  const createRuleMutation = useMutation({
    mutationFn: async (data: RuleFormData & { templateId: string }) => {
      return apiRequest("POST", "/api/rules", data);
    },
    onSuccess: () => {
      invalidateRules();
      setIsRuleDialogOpen(false);
      setRuleForm(defaultRuleForm);
      setFormErrors({});
      toast({ title: "Success", description: "Rule created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create rule", variant: "destructive" });
    },
  });

  const updateRuleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<RuleFormData> }) => {
      return apiRequest("PUT", `/api/rules/${id}`, data);
    },
    onSuccess: () => {
      invalidateRules();
      setIsRuleDialogOpen(false);
      setEditingRule(null);
      setRuleForm(defaultRuleForm);
      setFormErrors({});
      toast({ title: "Success", description: "Rule updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update rule", variant: "destructive" });
    },
  });

  const deleteRuleMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/rules/${id}`);
    },
    onSuccess: () => {
      invalidateRules();
      invalidateEmployees();
      toast({ title: "Success", description: "Rule deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete rule", variant: "destructive" });
    },
  });

  const createEmployeeMutation = useMutation({
    mutationFn: async (data: EmployeeFormData & { ruleId: string }) => {
      return apiRequest("POST", "/api/employees", { 
        ruleId: data.ruleId,
        username: data.username.trim(),
        permissions: data.permissions.trim() || null 
      });
    },
    onSuccess: () => {
      invalidateEmployees();
      setIsEmployeeDialogOpen(false);
      setEmployeeForm(defaultEmployeeForm);
      setFormErrors({});
      toast({ title: "Success", description: "Employee added successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add employee", variant: "destructive" });
    },
  });

  const bulkUploadMutation = useMutation({
    mutationFn: async ({ ruleId, employees }: { ruleId: string; employees: { username: string; permissions?: string }[] }) => {
      return apiRequest("POST", "/api/employees/bulk", { ruleId, employees });
    },
    onSuccess: () => {
      invalidateEmployees();
      setIsBulkUploadOpen(false);
      setBulkText("");
      setSelectedRuleId(null);
      toast({ title: "Success", description: "Employees uploaded successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to upload employees", variant: "destructive" });
    },
  });

  const deleteEmployeeMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/employees/${id}`);
    },
    onSuccess: () => {
      invalidateEmployees();
      toast({ title: "Success", description: "Employee removed successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to remove employee", variant: "destructive" });
    },
  });

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleTemplateSubmit = () => {
    const errors: Record<string, string> = {};
    
    if (!templateForm.name.trim()) {
      errors.name = "Template name is required";
    }
    if (!templateForm.adminName.trim()) {
      errors.adminName = "Administrator name is required";
    }
    if (!templateForm.managerEmail.trim()) {
      errors.managerEmail = "Manager email is required";
    } else if (!validateEmail(templateForm.managerEmail)) {
      errors.managerEmail = "Please enter a valid email address";
    }
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    setFormErrors({});
    
    const data = {
      name: templateForm.name.trim(),
      adminName: templateForm.adminName.trim(),
      managerEmail: templateForm.managerEmail.trim(),
      schedule: templateForm.schedule,
    };
    
    if (editingTemplate) {
      updateTemplateMutation.mutate({ id: editingTemplate.id, data });
    } else {
      createTemplateMutation.mutate(data);
    }
  };

  const handleRuleSubmit = () => {
    if (!selectedTemplate) {
      toast({ title: "Error", description: "Please select a template first", variant: "destructive" });
      return;
    }
    
    const errors: Record<string, string> = {};
    
    if (!ruleForm.ruleName.trim()) {
      errors.ruleName = "Rule name is required";
    }
    if (!ruleForm.jobDescription.trim()) {
      errors.jobDescription = "Job description is required";
    }
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    setFormErrors({});
    
    const data = {
      ruleName: ruleForm.ruleName.trim(),
      jobDescription: ruleForm.jobDescription.trim(),
    };
    
    if (editingRule) {
      updateRuleMutation.mutate({ id: editingRule.id, data });
    } else {
      createRuleMutation.mutate({ ...data, templateId: selectedTemplate });
    }
  };

  const handleEmployeeSubmit = () => {
    if (!selectedRuleId) {
      toast({ title: "Error", description: "No rule selected", variant: "destructive" });
      return;
    }
    
    const errors: Record<string, string> = {};
    
    if (!employeeForm.username.trim()) {
      errors.username = "Username is required";
    }
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    setFormErrors({});
    createEmployeeMutation.mutate({ 
      ...employeeForm, 
      ruleId: selectedRuleId 
    });
  };

  const handleBulkUpload = () => {
    if (!selectedRuleId) {
      toast({ title: "Error", description: "No rule selected", variant: "destructive" });
      return;
    }
    
    const lines = bulkText.split("\n").filter(line => line.trim());
    if (lines.length === 0) {
      toast({ title: "Error", description: "Please enter at least one employee", variant: "destructive" });
      return;
    }
    
    const employees = lines.map(line => {
      const parts = line.split(",").map(p => p.trim());
      return {
        username: parts[0],
        permissions: parts[1] || undefined,
      };
    }).filter(emp => emp.username);
    
    if (employees.length === 0) {
      toast({ title: "Error", description: "No valid employees found", variant: "destructive" });
      return;
    }
    
    bulkUploadMutation.mutate({ ruleId: selectedRuleId, employees });
  };

  const handleDownloadReport = async (templateId: string) => {
    try {
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const startDate = weekAgo.toISOString();
      const endDate = now.toISOString();
      
      const response = await fetch(`/api/reports/download?templateId=${templateId}&startDate=${startDate}&endDate=${endDate}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `weekly-report-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({ title: "Report Downloaded", description: "Your weekly report has been downloaded" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to download report", variant: "destructive" });
    }
  };

  const openAddTemplate = () => {
    setEditingTemplate(null);
    setTemplateForm(defaultTemplateForm);
    setFormErrors({});
    setIsTemplateDialogOpen(true);
  };

  const openEditTemplate = (template: ReportTemplate) => {
    setEditingTemplate(template);
    setTemplateForm({
      name: template.name,
      adminName: template.adminName,
      managerEmail: template.managerEmail,
      schedule: template.schedule,
    });
    setFormErrors({});
    setIsTemplateDialogOpen(true);
  };

  const openAddRule = () => {
    if (!selectedTemplate) {
      toast({ title: "Error", description: "Please select a template first", variant: "destructive" });
      return;
    }
    setEditingRule(null);
    setRuleForm(defaultRuleForm);
    setFormErrors({});
    setIsRuleDialogOpen(true);
  };

  const openEditRule = (rule: ReportRule) => {
    setEditingRule(rule);
    setRuleForm({
      ruleName: rule.ruleName,
      jobDescription: rule.jobDescription,
    });
    setFormErrors({});
    setIsRuleDialogOpen(true);
  };

  const openAddEmployee = (ruleId: string) => {
    setSelectedRuleId(ruleId);
    setEmployeeForm(defaultEmployeeForm);
    setFormErrors({});
    setIsEmployeeDialogOpen(true);
  };

  const openBulkUpload = (ruleId: string) => {
    setSelectedRuleId(ruleId);
    setBulkText("");
    setIsBulkUploadOpen(true);
  };

  const getEmployeesForRule = (ruleId: string) => {
    return allEmployees.filter(emp => emp.ruleId === ruleId);
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-1">Report Templates</h2>
          <p className="text-muted-foreground">Create templates with rules and employees for weekly analysis reports.</p>
        </div>
        <Button onClick={openAddTemplate} data-testid="button-add-template">
          <Plus className="h-4 w-4 mr-2" />
          New Template
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Templates</h3>
          {templatesLoading ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : templates.length === 0 ? (
            <Card className="bg-sidebar/30 border-sidebar-border">
              <CardContent className="p-6 text-center text-muted-foreground">
                No templates yet. Create your first template to get started.
              </CardContent>
            </Card>
          ) : (
            templates.map((template) => (
              <Card 
                key={template.id} 
                className={`bg-sidebar/30 border-sidebar-border cursor-pointer transition-colors ${
                  selectedTemplate === template.id ? "border-primary" : ""
                }`}
                onClick={() => setSelectedTemplate(template.id)}
                data-testid={`card-template-${template.id}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base">{template.name}</CardTitle>
                      <CardDescription className="text-xs mt-1">
                        Admin: {template.adminName}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      <Calendar className="h-3 w-3 mr-1" />
                      {template.schedule}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Mail className="h-3 w-3 mr-2" />
                    {template.managerEmail}
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={(e) => { e.stopPropagation(); openEditTemplate(template); }}
                      data-testid={`button-edit-template-${template.id}`}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={(e) => { e.stopPropagation(); handleDownloadReport(template.id); }}
                      data-testid={`button-download-template-${template.id}`}
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={(e) => { e.stopPropagation(); deleteTemplateMutation.mutate(template.id); }}
                      data-testid={`button-delete-template-${template.id}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <div className="lg:col-span-2">
          {selectedTemplate ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Rules & Employees
                </h3>
                <Button size="sm" onClick={openAddRule} data-testid="button-add-rule">
                  <Plus className="h-3 w-3 mr-2" />
                  Add Rule
                </Button>
              </div>

              {rules.length === 0 ? (
                <Card className="bg-sidebar/30 border-sidebar-border">
                  <CardContent className="p-6 text-center text-muted-foreground">
                    No rules yet. Add rules to define employee permissions and job descriptions.
                  </CardContent>
                </Card>
              ) : (
                <Accordion type="multiple" className="space-y-2">
                  {rules.map((rule) => (
                    <AccordionItem 
                      key={rule.id} 
                      value={rule.id}
                      className="bg-sidebar/30 border border-sidebar-border rounded-md overflow-hidden"
                    >
                      <AccordionTrigger className="px-4 py-3 hover:no-underline" data-testid={`accordion-rule-${rule.id}`}>
                        <div className="flex items-center gap-3 text-left">
                          <Shield className="h-4 w-4 text-primary flex-shrink-0" />
                          <div className="min-w-0">
                            <div className="font-medium text-sm">{rule.ruleName}</div>
                            <div className="text-xs text-muted-foreground truncate">
                              {getEmployeesForRule(rule.id).length} employees
                            </div>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4">
                        <div className="space-y-4">
                          <div className="p-3 bg-background/50 rounded-md">
                            <div className="text-xs font-medium text-muted-foreground mb-1">Job Description</div>
                            <div className="text-sm">{rule.jobDescription}</div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Button size="sm" variant="outline" onClick={() => openEditRule(rule)} data-testid={`button-edit-rule-${rule.id}`}>
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => openAddEmployee(rule.id)} data-testid={`button-add-employee-${rule.id}`}>
                              <Plus className="h-3 w-3 mr-1" />
                              Add Employee
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => openBulkUpload(rule.id)} data-testid={`button-bulk-upload-${rule.id}`}>
                              <Upload className="h-3 w-3 mr-1" />
                              Bulk Upload
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => deleteRuleMutation.mutate(rule.id)}
                              data-testid={`button-delete-rule-${rule.id}`}
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Delete
                            </Button>
                          </div>

                          <div>
                            <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              Employees ({getEmployeesForRule(rule.id).length})
                            </div>
                            <div className="space-y-2">
                              {getEmployeesForRule(rule.id).length === 0 ? (
                                <div className="text-xs text-muted-foreground p-2 bg-background/50 rounded">
                                  No employees assigned to this rule yet.
                                </div>
                              ) : (
                                getEmployeesForRule(rule.id).map((emp) => (
                                  <div 
                                    key={emp.id} 
                                    className="flex items-center justify-between p-2 bg-background/50 rounded"
                                    data-testid={`employee-item-${emp.id}`}
                                  >
                                    <div className="flex-1 min-w-0">
                                      <div className="text-sm font-medium">{emp.username}</div>
                                      {emp.permissions && (
                                        <div className="text-xs text-muted-foreground">{emp.permissions}</div>
                                      )}
                                    </div>
                                    <Button 
                                      size="sm" 
                                      variant="ghost" 
                                      onClick={() => deleteEmployeeMutation.mutate(emp.id)}
                                      data-testid={`button-delete-employee-${emp.id}`}
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </div>
          ) : (
            <Card className="bg-sidebar/30 border-sidebar-border h-full flex items-center justify-center">
              <CardContent className="text-center text-muted-foreground p-8">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a template to view and manage its rules and employees.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTemplate ? "Edit Template" : "Create New Template"}</DialogTitle>
            <DialogDescription>
              Configure the report template with administrator details and manager email.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">Template Name</Label>
              <Input
                id="template-name"
                value={templateForm.name}
                onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                placeholder="Weekly Security Report"
                data-testid="input-template-name"
              />
              {formErrors.name && <p className="text-sm text-destructive">{formErrors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-name">Administrator Name</Label>
              <Input
                id="admin-name"
                value={templateForm.adminName}
                onChange={(e) => setTemplateForm({ ...templateForm, adminName: e.target.value })}
                placeholder="John Smith"
                data-testid="input-admin-name"
              />
              {formErrors.adminName && <p className="text-sm text-destructive">{formErrors.adminName}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="manager-email">Manager Email</Label>
              <Input
                id="manager-email"
                type="email"
                value={templateForm.managerEmail}
                onChange={(e) => setTemplateForm({ ...templateForm, managerEmail: e.target.value })}
                placeholder="manager@example.com"
                data-testid="input-manager-email"
              />
              {formErrors.managerEmail && <p className="text-sm text-destructive">{formErrors.managerEmail}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="schedule">Report Schedule</Label>
              <Select
                value={templateForm.schedule}
                onValueChange={(value) => setTemplateForm({ ...templateForm, schedule: value })}
              >
                <SelectTrigger id="schedule" data-testid="select-schedule">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleTemplateSubmit}
              disabled={createTemplateMutation.isPending || updateTemplateMutation.isPending}
              data-testid="button-submit-template"
            >
              {editingTemplate ? "Update" : "Create"} Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isRuleDialogOpen} onOpenChange={setIsRuleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRule ? "Edit Rule" : "Add New Rule"}</DialogTitle>
            <DialogDescription>
              Define a rule with job description for employee log analysis.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rule-name">Rule Name</Label>
              <Input
                id="rule-name"
                value={ruleForm.ruleName}
                onChange={(e) => setRuleForm({ ...ruleForm, ruleName: e.target.value })}
                placeholder="Network Operations"
                data-testid="input-rule-name"
              />
              {formErrors.ruleName && <p className="text-sm text-destructive">{formErrors.ruleName}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="job-description">Job Description</Label>
              <Textarea
                id="job-description"
                value={ruleForm.jobDescription}
                onChange={(e) => setRuleForm({ ...ruleForm, jobDescription: e.target.value })}
                placeholder="Describe the responsibilities and permissions for this role..."
                rows={4}
                data-testid="input-job-description"
              />
              {formErrors.jobDescription && <p className="text-sm text-destructive">{formErrors.jobDescription}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleRuleSubmit}
              disabled={createRuleMutation.isPending || updateRuleMutation.isPending}
              data-testid="button-submit-rule"
            >
              {editingRule ? "Update" : "Add"} Rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEmployeeDialogOpen} onOpenChange={setIsEmployeeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Employee</DialogTitle>
            <DialogDescription>
              Add an employee username to this rule for log analysis.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={employeeForm.username}
                onChange={(e) => setEmployeeForm({ ...employeeForm, username: e.target.value })}
                placeholder="employee_username"
                data-testid="input-employee-username"
              />
              {formErrors.username && <p className="text-sm text-destructive">{formErrors.username}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="permissions">Permissions (optional)</Label>
              <Input
                id="permissions"
                value={employeeForm.permissions}
                onChange={(e) => setEmployeeForm({ ...employeeForm, permissions: e.target.value })}
                placeholder="read, write, admin"
                data-testid="input-employee-permissions"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleEmployeeSubmit}
              disabled={createEmployeeMutation.isPending}
              data-testid="button-submit-employee"
            >
              Add Employee
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isBulkUploadOpen} onOpenChange={setIsBulkUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Upload Employees</DialogTitle>
            <DialogDescription>
              Enter employee usernames, one per line. Optionally add permissions after a comma.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="bulk-text">Employees (one per line)</Label>
              <Textarea
                id="bulk-text"
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder="username1, read
username2, write
username3"
                rows={8}
                className="font-mono text-sm"
                data-testid="textarea-bulk-upload"
              />
            </div>
            <div className="text-xs text-muted-foreground">
              Format: username or username, permissions
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleBulkUpload}
              disabled={bulkUploadMutation.isPending || !bulkText.trim()}
              data-testid="button-submit-bulk-upload"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Employees
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
