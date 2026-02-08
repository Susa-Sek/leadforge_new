// Privacy Settings Page - Epic E13 US-30.5
// Route: /dashboard/einstellungen/datenschutz

'use client';

import { useState } from 'react';
import { Download, Trash2, AlertTriangle, Clock, CheckCircle, Shield } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';

export default function PrivacySettingsPage() {
  const [isExporting, setIsExporting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [pendingDeletion, setPendingDeletion] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);

      const response = await fetch('/api/settings/privacy/export');

      if (!response.ok) {
        throw new Error('Fehler beim Exportieren');
      }

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gdpr-export-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Datenexport erfolgreich heruntergeladen');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Export fehlgeschlagen');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteRequest = async () => {
    if (deleteConfirmation !== 'DELETE') {
      toast.error('Bitte geben Sie "DELETE" ein, um zu bestätigen');
      return;
    }

    try {
      setIsDeleting(true);

      const response = await fetch('/api/settings/privacy/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confirmation: 'DELETE',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Löschung fehlgeschlagen');
      }

      const result = await response.json();

      toast.success('Konto-Löschung beantragt. Sie haben 30 Tage Zeit, dies rückgängig zu machen.');
      setPendingDeletion(true);
      setDeleteDialogOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Fehler beim Beantragen der Löschung');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDeletion = async () => {
    try {
      const response = await fetch('/api/settings/privacy/delete-account', {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Stornierung fehlgeschlagen');
      }

      toast.success('Konto-Löschung erfolgreich storniert');
      setPendingDeletion(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Fehler beim Stornieren');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Datenschutz</h1>
        <p className="text-muted-foreground">
          Verwalten Sie Ihre Daten und Privatsphäre-Einstellungen
        </p>
      </div>

      <Separator />

      {/* GDPR Export */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Download className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Daten exportieren (GDPR)</CardTitle>
              <CardDescription>
                Laden Sie eine Kopie aller Ihrer gespeicherten Daten herunter
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Gemäß der DSGVO haben Sie das Recht, eine Kopie aller Daten, die wir über Sie
            speichern, zu erhalten. Der Export umfasst:
          </p>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Profilinformationen und Einstellungen</li>
              <li>Suchhistorie und Sammlungen</li>
            <li>CRM-Daten (Kontakte, Deals)</li>
            <li>Benachrichtigungen</li>
            <li>Transaktionshistorie</li>
          </ul>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? 'Export wird erstellt...' : 'Daten exportieren'}
          </Button>
        </CardContent>
      </Card>

      {/* Account Deletion */}
      <Card className="border-destructive/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-destructive/10 rounded-lg">
              <Trash2 className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <CardTitle className="text-destructive">Konto löschen</CardTitle>
              <CardDescription>
                Permanente Löschung Ihres Kontos und aller Daten
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {pendingDeletion ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="font-medium text-yellow-800 dark:text-yellow-200">
                    Konto-Löschung beantragt
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    Ihr Konto wird in 30 Tagen gelöscht. Sie können dies jederzeit stornieren.
                  </p>
                </div>
              </div>
              <Button variant="outline" onClick={handleCancelDeletion}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Löschung stornieren
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Die Löschung Ihres Kontos ist permanent und kann nicht rückgängig gemacht werden.
                  Alle Ihre Daten werden entfernt:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Profil und Einstellungen</li>
                  <li>Alle gespeicherten Kontakte und Deals</li>
                  <li>Suchhistorie und Sammlungen</li>
                  <li>Transaktionshistorie</li>
                </ul>
                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                  Hinweis: Nach Beantragung haben Sie 30 Tage Zeit, die Löschung zu stornieren.
                </p>
              </div>
              <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Konto löschen beantragen
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Data Usage Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Datennutzung</CardTitle>
              <CardDescription>
                Informationen zur Verarbeitung Ihrer Daten
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm text-muted-foreground">
            <p>
              Wir nehmen den Schutz Ihrer Daten ernst. Ihre Daten werden ausschließlich für
              die Bereitstellung unserer Dienstleistungen verwendet und niemals an Dritte
              verkauft.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-medium text-foreground mb-1">Speicherort</h4>
                <p>Deutschland (EU) - GDPR-konform</p>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-1">Aufbewahrung</h4>
                <p>Bis zur Konto-Löschung oder 2 Jahre Inaktivität</p>
              </div>
            </div>
            <p>
              Bei Fragen zum Datenschutz kontaktieren Sie uns unter{' '}
              <a href="mailto:privacy@manyleads.io" className="text-primary hover:underline">
                privacy@manyleads.io
              </a>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Konto-Löschung bestätigen
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>
                Diese Aktion kann nicht rückgängig gemacht werden. Alle Ihre Daten werden
                permanent gelöscht.
              </p>
              <div className="space-y-2">
                <Label htmlFor="confirm">
                  Geben Sie "DELETE" ein, um zu bestätigen:
                </Label>
                <Input
                  id="confirm"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  placeholder="DELETE"
                  className="uppercase"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteRequest}
              disabled={deleteConfirmation !== 'DELETE' || isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? 'Wird beantragt...' : 'Konto löschen'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
