import { useState } from 'react';
import { Button, Checkbox, Input, Radio } from 'antd';
import { uiText } from '../localization/uiText';
import type { CliPermission, CliRequest, CliSession } from './types';

export function CliPermissions({ session, busy, respond }: {
  session: CliSession; busy: boolean; respond: (request: CliRequest) => Promise<void>;
}) {
  return <div className="cli-gui-permissions">
    {session.permissions.map(permission => <Permission key={permission.id} permission={permission}
      busy={busy} submit={(actionId, answers) => respond({ engine: session.engine, action: 'approve',
        id: session.id, permissionId: permission.id, actionId, answers })} />)}
  </div>;
}

function Permission({ permission, busy, submit }: {
  permission: CliPermission; busy: boolean;
  submit: (action: string, answers?: Record<string, string>) => Promise<void>;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const answer = (question: string, value: string) => setAnswers(previous => ({ ...previous, [question]: value }));
  const complete = permission.questions?.every(question => answers[question.question]?.trim()) ?? true;
  return <section className="cli-gui-permission" aria-label={uiText('client.cliGui.approval')}>
    <strong>{permission.title}</strong>
    {permission.description && <p>{permission.description}</p>}
    {permission.questions?.map(question => <fieldset key={question.question}>
      <legend>{question.question}</legend>
      {question.options.length > 0 && (question.multiple
        ? <Checkbox.Group options={question.options} onChange={values => answer(question.question, values.join(', '))} />
        : <Radio.Group options={question.options} value={answers[question.question]}
          onChange={event => answer(question.question, event.target.value)} />)}
      <Input value={answers[question.question] ?? ''} onChange={event => answer(question.question, event.target.value)}
        aria-label={question.question} />
    </fieldset>)}
    <div className="cli-gui-permission-actions">{permission.actions.map(action => <Button key={action.id}
      type={action.behavior === 'allow' ? 'primary' : 'default'} disabled={busy || action.behavior === 'allow' && !complete}
      onClick={() => { void submit(action.id, permission.questions?.length ? answers : undefined); }}>
      {action.label || uiText(action.behavior === 'allow' ? 'client.cliGui.allow' : 'client.cliGui.deny')}
    </Button>)}</div>
  </section>;
}
