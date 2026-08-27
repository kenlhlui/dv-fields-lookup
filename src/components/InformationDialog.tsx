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

interface InformationDialogProps {
  // pre-rendered from src/content/information.md via Astro's markdown compiler
  html: string;
}

export default function InformationDialog({ html }: InformationDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Information">
          <Info />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Information</DialogTitle>
        </DialogHeader>
        <div
          className="space-y-3 text-sm text-muted-foreground [&_a:hover]:text-foreground [&_a]:underline [&_a]:underline-offset-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_strong]:font-medium [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:pl-5"
          // eslint-disable-next-line react/no-danger -- trusted, build-time content from src/content/information.md
          dangerouslySetInnerHTML={{ __html: html }}
        />
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
