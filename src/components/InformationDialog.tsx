import { Info } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useTranslations, type Lang } from '@/i18n/utils';

interface InformationDialogProps {
  // pre-rendered from src/content/information.<lang>.md via Astro's markdown compiler
  html: string;
  lang: Lang;
}

export default function InformationDialog({ html, lang }: InformationDialogProps) {
  const t = useTranslations(lang);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t('info.trigger')}>
          <Info />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('info.title')}</DialogTitle>
        </DialogHeader>
        <div
          className="space-y-3 text-sm text-muted-foreground [&_a:hover]:text-foreground [&_a]:underline [&_a]:underline-offset-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_strong]:font-medium [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:pl-5"
          // eslint-disable-next-line react/no-danger -- trusted, build-time content from src/content/information.<lang>.md
          dangerouslySetInnerHTML={{ __html: html }}
        />
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">{t('info.close')}</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
