import fs from 'fs';

const vueTypesPath = 'packages/app-vue/src/di/types.ts';
let content = fs.readFileSync(vueTypesPath, 'utf8');

content = content.replace(/import\('@dailyuse\/account\/application-client'\)\.AccountClientService/g, 'any');
content = content.replace(/import\('@dailyuse\/authentication\/application-client'\)\.AuthClientService/g, 'any');
content = content.replace(/import\('@dailyuse\/goal\/application-client'\)\.GoalClientService/g, 'any');
content = content.replace(/import\('@dailyuse\/task\/application-client'\)\.TaskClientService/g, 'any');
content = content.replace(/import\('@dailyuse\/schedule\/application-client'\)\.ScheduleClientService/g, 'any');
content = content.replace(/import\('@dailyuse\/reminder\/application-client'\)\.ReminderClientService/g, 'any');
content = content.replace(/import\('@dailyuse\/repository\/application-client'\)\.RepositoryClientService/g, 'any');
content = content.replace(/import\('@dailyuse\/notification\/application-client'\)\.NotificationClientService/g, 'any');
content = content.replace(/import\('@dailyuse\/setting\/application-client'\)\.SettingClientService/g, 'any');
content = content.replace(/import\('@dailyuse\/governance\/infrastructure-client'\)\.GovernanceHttpClient/g, 'any');


fs.writeFileSync(vueTypesPath, content);
