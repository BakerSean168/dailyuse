import { NotificationTemplateConfig } from '../NotificationTemplateConfig';

describe('NotificationTemplateConfig', () => {
  it('renders variables, validates requirements, and exposes enabled channels', () => {
    const config = NotificationTemplateConfig.create({
      template: {
        title: 'Hello {{name}}',
        content: 'Balance {{amount}}',
        variables: ['name', 'amount'],
      },
      channels: {
        inApp: true,
        email: true,
        push: false,
        sms: false,
      },
      emailTemplate: {
        subject: 'Hi {{name}}',
        htmlBody: '<p>{{amount}}</p>',
      },
      pushTemplate: {
        title: 'Push {{name}}',
        body: 'Alert {{amount}}',
      },
    });

    expect(config.render({ name: 'Ada', amount: 3 }).title).toBe('Hello Ada');
    expect(config.render({ name: 'Ada', amount: 3 }).content).toBe('Balance 3');
    expect(config.validateVariables({ name: 'Ada' })).toEqual({
      isValid: false,
      missingVariables: ['amount'],
    });
    expect(config.isChannelEnabled('email')).toBe(true);
    expect(config.getEnabledChannels()).toEqual(['inApp', 'email']);
  });

  it('creates defaults and returns immutable updated copies', () => {
    const config = NotificationTemplateConfig.createDefault()
      .withTemplate({ title: 'Title', content: 'Body', variables: ['user'] })
      .withChannels({ push: true })
      .withEmailTemplate({ subject: 'Sub', htmlBody: '<b>x</b>' })
      .withPushTemplate({ title: 'Push', body: 'Body', sound: 'ding' });

    expect(config.template.title).toBe('Title');
    expect(config.channels.push).toBe(true);
    expect(config.emailTemplate?.subject).toBe('Sub');
    expect(config.pushTemplate?.sound).toBe('ding');
    expect(NotificationTemplateConfig.fromContract(config.toDTO()).toContract()).toEqual(config.toDTO());
  });
});
