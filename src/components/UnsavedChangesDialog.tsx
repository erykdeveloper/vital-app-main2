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

interface UnsavedChangesDialogProps {
  open: boolean;
  onDiscard: () => void;
  onSave: () => void;
  saving?: boolean;
}

export function UnsavedChangesDialog({
  open,
  onDiscard,
  onSave,
  saving = false
}: UnsavedChangesDialogProps) {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Treino não salvo</AlertDialogTitle>
          <AlertDialogDescription>
            Você tem um treino registrado que não foi salvo. Se sair agora, perderá esses dados.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onDiscard} disabled={saving}>
            Sair sem Salvar
          </AlertDialogCancel>
          <AlertDialogAction onClick={onSave} disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar Treino'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
