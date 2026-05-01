'use client';

import {
  Badge,
  Button,
  Card,
  CardBody,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Form,
  FormActions,
  FormField,
  FormRow,
  FormSection,
  Input,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeaderCell,
  TableRow,
  Textarea,
} from '@/components/ui';

/**
 * Design-system showcase.
 * Not a real product page — just a living gallery for the components.
 */
export default function DesignSystemPage() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-10 px-4 py-10 sm:px-6 sm:py-14">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          BlockKit <span className="text-brand-600">design system</span>
        </h1>
        <p className="max-w-2xl text-paper-600">
          Cartoon + Minecraft-inspired. Chunky blocks, soft drop shadows, pixel-crisp
          edges — with modern typography and a restrained palette.
        </p>
      </header>

      {/* Buttons */}
      <Section title="Buttons">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="sky">Sky</Button>
          <Button variant="danger">Danger</Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
          <Button loading>Loading</Button>
          <Button disabled>Disabled</Button>
        </div>
      </Section>

      {/* Inputs */}
      <Section title="Inputs">
        <Card>
          <CardBody>
            <FormRow cols={2}>
              <FormField label="Email" required hint="We won't send spam.">
                <Input type="email" placeholder="you@example.com" />
              </FormField>
              <FormField label="Password" required>
                <Input type="password" placeholder="••••••••" />
              </FormField>
              <FormField label="Role">
                <Select defaultValue="user">
                  <option value="admin">Admin</option>
                  <option value="user">User</option>
                  <option value="viewer">Viewer</option>
                </Select>
              </FormField>
              <FormField label="Search" hint="Leading icon support.">
                <Input
                  placeholder="Search apps…"
                  leading={
                    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none">
                      <circle cx="9" cy="9" r="5.5" stroke="currentColor" strokeWidth="2" />
                      <path d="m14 14 3 3" stroke="currentColor" strokeWidth="2" />
                    </svg>
                  }
                />
              </FormField>
              <FormField
                label="Broken field"
                error="Must be at least 8 characters."
                className="sm:col-span-2"
              >
                <Input defaultValue="short" />
              </FormField>
              <FormField label="Bio" className="sm:col-span-2">
                <Textarea placeholder="Tell us about your app…" />
              </FormField>
            </FormRow>
          </CardBody>
        </Card>
      </Section>

      {/* Cards */}
      <Section title="Cards">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Default card</CardTitle>
              <CardDescription>Chunky block with a drop shadow.</CardDescription>
            </CardHeader>
            <CardBody>
              <p className="text-sm text-paper-700">
                Stack <code>CardHeader</code>, <code>CardBody</code>,{' '}
                <code>CardFooter</code> as needed.
              </p>
            </CardBody>
            <CardFooter>
              <Button variant="ghost" size="sm">
                Cancel
              </Button>
              <Button size="sm">Save</Button>
            </CardFooter>
          </Card>

          <Card tone="brand">
            <CardHeader>
              <CardTitle>Brand tone</CardTitle>
              <CardDescription>For success states or hero callouts.</CardDescription>
            </CardHeader>
            <CardBody>
              <Badge tone="brand">Active</Badge>
            </CardBody>
          </Card>

          <Card tone="sky" interactive as="button" className="text-left">
            <CardHeader>
              <CardTitle>Interactive</CardTitle>
              <CardDescription>
                Hover + active states. Rendered as a <code>&lt;button&gt;</code>.
              </CardDescription>
            </CardHeader>
            <CardBody>
              <p className="text-sm text-paper-700">Click anywhere on the card.</p>
            </CardBody>
          </Card>
        </div>
      </Section>

      {/* Badges */}
      <Section title="Badges">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>Neutral</Badge>
          <Badge tone="brand">Published</Badge>
          <Badge tone="sky">Draft</Badge>
          <Badge tone="sun">Beta</Badge>
          <Badge tone="ember">Archived</Badge>
        </div>
      </Section>

      {/* Table */}
      <Section title="Table">
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Name</TableHeaderCell>
                <TableHeaderCell>Email</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell align="right">Value</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {demoRows.map((r) => (
                <TableRow key={r.email}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell muted>{r.email}</TableCell>
                  <TableCell>
                    <Badge tone={r.status === 'Active' ? 'brand' : 'sky'}>{r.status}</Badge>
                  </TableCell>
                  <TableCell align="right">${r.value.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Section>

      {/* Form */}
      <Section title="Full form">
        <Card>
          <CardBody>
            <Form onSubmit={(e) => e.preventDefault()}>
              <FormSection
                title="Profile"
                description="Basic info shown on your public profile."
              >
                <FormRow cols={2}>
                  <FormField label="First name" required>
                    <Input placeholder="Jane" />
                  </FormField>
                  <FormField label="Last name" required>
                    <Input placeholder="Doe" />
                  </FormField>
                </FormRow>
                <FormField label="Headline">
                  <Input placeholder="Full-stack developer" />
                </FormField>
                <FormField label="Bio" hint="Max 500 characters.">
                  <Textarea rows={5} />
                </FormField>
              </FormSection>

              <FormActions>
                <Button variant="ghost" type="reset">
                  Cancel
                </Button>
                <Button type="submit">Save changes</Button>
              </FormActions>
            </Form>
          </CardBody>
        </Card>
      </Section>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-paper-500">
        {title}
      </h2>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}

const demoRows = [
  { name: 'Jane Doe', email: 'jane@example.com', status: 'Active', value: 1240 },
  { name: 'Mark Lee', email: 'mark@example.com', status: 'Lead', value: 520 },
  { name: 'Ana Costa', email: 'ana@example.com', status: 'Active', value: 3100 },
];
