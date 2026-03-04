import { Code, BookOpen } from 'lucide-react';
import { m } from '@/paraglide/messages.js';
import { Card } from '@/components/ui/Card.tsx';
import { CardHeader } from '@/components/ui/CardHeader.tsx';
import { List, ListItem } from '@/components/ui/List.tsx';

const GITHUB_URL = 'https://github.com/fabianhinz/PaceVault';
const SOURCES_URL = 'https://github.com/fabianhinz/PaceVault/blob/main/src/engine/SOURCES.md';

const openExternal = (url: string) => window.open(url, '_blank', 'noopener,noreferrer');

export const AboutSection = () => (
  <Card>
    <CardHeader title={m.ui_settings_about_title()} subtitle={m.ui_settings_about_desc()} />
    <List>
      <ListItem
        icon={<Code size={18} />}
        primary={m.ui_settings_about_github()}
        secondary={m.ui_settings_about_github_desc()}
        onClick={() => openExternal(GITHUB_URL)}
      />

      <ListItem
        icon={<BookOpen size={18} />}
        primary={m.ui_settings_about_sources()}
        secondary={m.ui_settings_about_sources_desc()}
        onClick={() => openExternal(SOURCES_URL)}
      />
    </List>
  </Card>
);
