import { initModalController } from './modal-controller.js';

/* Fonte: GRUPO 1.pdf. null = informação ainda não confirmada pela clínica.
 * Preencher canais somente após validação. Telefone/WhatsApp: formato +55DDDNUMERO.
 * location: { address: 'endereço confirmado', mapUrl: 'https://...' }
 * openingHours: texto com dias/horários confirmados; bookingUrl: serviço oficial.
 * Nenhum cadastro ou dado de paciente é coletado neste portal.
 */
export const CLINICS = [
  {
    id: 'odontologia', name: 'Odontologia', icon: 'tooth',
    summary: 'Consultas e tratamentos básicos gratuitos. Exames de imagem pagos.',
    services: ['Extrações dentárias, incluindo sisos e dentes infeccionados.', 'Tratamento de canal.', 'Moldagem inicial protética.'],
    costs: 'As consultas e os tratamentos odontológicos básicos são gratuitos. Os exames de imagem solicitados, como radiografias e tomografias, são pagos.',
    audience: 'Atendimento a todas as faixas etárias: crianças, adolescentes, jovens, adultos e idosos.',
    restrictions: ['Procedimentos odontológicos estéticos avançados não são oferecidos.'],
    location: null, openingHours: null, bookingUrl: null, phone: null, whatsapp: null, email: null,
  },
  {
    id: 'veterinaria', name: 'Medicina Veterinária', icon: 'paw',
    summary: 'Atendimento pago para animais de pequeno e grande porte.',
    services: ['Avaliações clínicas veterinárias.', 'Procedimentos cirúrgicos veterinários, sujeitos à confirmação com a clínica.'],
    costs: 'Os serviços da Clínica Veterinária são pagos. Confirme os valores diretamente com a equipe antes de solicitar o atendimento.',
    audience: 'Aberto à comunidade interna e externa. Pequeno porte: cães e gatos. Grande porte: cavalos e bois.',
    restrictions: ['Não há atendimento a animais silvestres.'],
    location: null, openingHours: null, bookingUrl: null, phone: null, whatsapp: null, email: null,
  },
  {
    id: 'psicologia', name: 'Psicologia', icon: 'psychology',
    summary: 'Atendimento gratuito.', services: ['Atendimento psicológico.'],
    costs: 'Os atendimentos da Clínica-Escola de Psicologia são 100% gratuitos.',
    audience: 'Confirme com a clínica as modalidades de atendimento disponíveis para a sua necessidade.',
    restrictions: [], location: null, openingHours: null, bookingUrl: null, phone: null, whatsapp: null, email: null,
  },
  {
    id: 'fisioterapia', name: 'Fisioterapia', icon: 'physio',
    summary: 'Atendimento gratuito.', services: ['Atendimento de fisioterapia.'],
    costs: 'Os atendimentos da Clínica-Escola de Fisioterapia são 100% gratuitos.',
    audience: 'Confirme com a clínica as modalidades de atendimento disponíveis para a sua necessidade.',
    restrictions: [], location: null, openingHours: null, bookingUrl: null, phone: null, whatsapp: null, email: null,
  },
];

const CHANNEL_NAMES = { whatsapp: 'WhatsApp', phone: 'Telefone', email: 'E-mail' };
const DOCUMENTS = 'Leve documento de identificação com foto e informe um telefone para contato. Para menores, são necessários a identificação, o acompanhamento e a autorização de um responsável legal. Confirme documentos complementares com a clínica.';

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function secureUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}

// Permite verificar destinos sem enviar mensagens ou fazer ligações.
export function contactUrl(clinic, channel) {
  const value = clinic?.[channel];
  if (typeof value !== 'string') return null;
  if (channel === 'email') {
    return /^[^\s@?&#]+@[^\s@?&#]+\.[^\s@?&#]+$/.test(value) ? `mailto:${value}` : null;
  }
  if (!['phone', 'whatsapp'].includes(channel) || !/^\+?\d[\d\s()-]+$/.test(value)) return null;
  const digits = value.replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 15) return null;
  return channel === 'phone' ? `tel:+${digits}` : `https://wa.me/${digits}?text=${encodeURIComponent(`Olá! Gostaria de informações sobre o atendimento de ${clinic.name} da FAMINAS.`)}`;
}

function clinicOptions(select) {
  for (const clinic of CLINICS) {
    const option = element('option', clinic.name);
    option.value = clinic.id;
    select.append(option);
  }
}

function renderCards() {
  const grid = document.getElementById('clinics-grid');
  const template = document.getElementById('clinic-card-template');
  for (const clinic of CLINICS) {
    const fragment = template.content.cloneNode(true);
    const card = fragment.querySelector('article');
    card.dataset.clinic = clinic.id;
    card.querySelector('use').setAttribute('href', `#icon-${clinic.icon}`);
    const title = card.querySelector('h3');
    title.textContent = clinic.name;
    title.id = `clinic-${clinic.id}`;
    card.setAttribute('aria-labelledby', title.id);
    card.querySelector('.clinic-card-description').textContent = clinic.summary;
    card.querySelectorAll('button').forEach(button => {
      button.dataset.clinic = clinic.id;
      button.setAttribute('aria-label', `${button.textContent.trim()} — ${clinic.name}`);
    });
    grid.append(fragment);
  }
}

function initClinicPortal() {
  const dialog = document.getElementById('clinic-dialog');
  const dialogBody = document.getElementById('clinic-dialog-body');
  const dialogTitle = document.getElementById('clinic-dialog-title');
  const dialogEyebrow = document.getElementById('clinic-dialog-eyebrow');
  const select = document.getElementById('contact-clinic');
  const status = document.getElementById('contact-status');
  let returnFocus = null;

  renderCards();
  clinicOptions(select);

  function updateContacts() {
    const clinic = CLINICS.find(item => item.id === select.value);
    const unavailable = [];
    document.querySelectorAll('[data-contact-channel]').forEach(link => {
      const channel = link.dataset.contactChannel;
      const url = contactUrl(clinic, channel);
      link.removeAttribute('href');
      link.removeAttribute('target');
      link.removeAttribute('rel');
      link.setAttribute('aria-disabled', String(!url));
      link.setAttribute('aria-label', clinic ? `${CHANNEL_NAMES[channel]} — ${clinic.name}${url ? '' : ' (ainda não disponibilizado)'}` : `${CHANNEL_NAMES[channel]} — selecione uma clínica`);
      if (url) {
        link.href = url;
        if (channel === 'whatsapp') { link.target = '_blank'; link.rel = 'noopener noreferrer'; }
      } else unavailable.push(CHANNEL_NAMES[channel]);
    });
    status.textContent = clinic
      ? unavailable.length ? `${clinic.name}: ${unavailable.join(', ')} ainda não disponibilizados. Os contatos oficiais estão em confirmação.` : `Canais oficiais de ${clinic.name}. Escolha como entrar em contato.`
      : '';
  }

  select.addEventListener('change', updateContacts);
  updateContacts();
  document.querySelectorAll('[data-contact-channel]').forEach(link => {
    const explainUnavailable = event => {
      if (link.getAttribute('aria-disabled') !== 'true') return;
      event.preventDefault();
      const clinic = CLINICS.find(item => item.id === select.value);
      status.textContent = clinic ? `${CHANNEL_NAMES[link.dataset.contactChannel]} de ${clinic.name}: informação ainda não disponibilizada. Aguarde a confirmação do canal oficial.` : 'Selecione uma clínica para consultar os canais de atendimento.';
      if (!clinic) select.focus();
    };
    link.addEventListener('click', explainUnavailable);
    link.addEventListener('keydown', event => {
      if (event.key === 'Enter' && !link.hasAttribute('href')) explainUnavailable(event);
    });
  });

  function section(title, text, parent = dialogBody, className) {
    const node = element('section', null, className);
    node.append(element('h3', title));
    if (text) node.append(element('p', text));
    parent.append(node);
    return node;
  }

  function contactAction(clinic, parent = dialogBody) {
    const actions = element('div', null, 'clinic-dialog-actions');
    const button = element('button', 'Ver canais de contato', 'clinic-button clinic-button-primary');
    button.type = 'button';
    button.addEventListener('click', () => {
      select.value = clinic.id;
      updateContacts();
      returnFocus = select;
      dialog.close();
      document.getElementById('contato').scrollIntoView({ block: 'center' });
    });
    actions.append(button);
    parent.append(actions);
  }

  function renderServices(clinic) {
    dialogTitle.textContent = clinic.name;
    dialogEyebrow.textContent = 'Serviços da clínica-escola';
    const services = section('Serviços oferecidos');
    const list = element('ul');
    clinic.services.forEach(service => list.append(element('li', service)));
    services.append(list);
    section('Custos do atendimento', clinic.costs, dialogBody, 'clinic-notice');
    section('Quem pode ser atendido', clinic.audience);
    if (clinic.restrictions.length) section('Restrições', clinic.restrictions.join(' '));
    section('Documentos e orientações', DOCUMENTS);
    if (clinic.id === 'veterinaria') {
      const phone = contactUrl(clinic, 'phone');
      const contact = section('Telefone exclusivo da Veterinária', phone ? null : 'O telefone exclusivo ainda não foi disponibilizado.');
      if (phone) { const link = element('a', clinic.phone); link.href = phone; contact.append(link); }
    }
    contactAction(clinic);
  }

  function renderHours(clinicId) {
    dialogTitle.textContent = 'Consultar horários';
    dialogEyebrow.textContent = 'Planeje seu atendimento';
    const label = element('label', 'Selecione a clínica');
    label.htmlFor = 'hours-clinic';
    const wrapper = element('div', null, 'clinic-select-wrapper');
    const hoursSelect = element('select');
    hoursSelect.id = 'hours-clinic';
    const placeholder = element('option', 'Escolha uma clínica');
    placeholder.value = '';
    hoursSelect.append(placeholder);
    clinicOptions(hoursSelect);
    hoursSelect.value = clinicId || '';
    wrapper.append(hoursSelect);
    const content = element('div');
    content.setAttribute('aria-live', 'polite');
    dialogBody.append(label, wrapper, content);

    function showHours() {
      content.replaceChildren();
      const clinic = CLINICS.find(item => item.id === hoursSelect.value);
      if (!clinic) {
        content.append(element('p', 'Escolha uma clínica para consultar o funcionamento e as orientações para solicitar um horário.', 'clinic-notice'));
        return;
      }
      section(`Funcionamento — ${clinic.name}`, clinic.openingHours || 'Os dias e horários de funcionamento ainda não foram disponibilizados.', content, 'clinic-notice');
      const bookingUrl = secureUrl(clinic.bookingUrl);
      section('Disponibilidade e solicitação', bookingUrl ? 'Consulte as vagas e solicite seu atendimento no serviço oficial da clínica. O horário de funcionamento não garante disponibilidade de consultas.' : 'A consulta de vagas e o agendamento online ainda não estão disponíveis neste portal. Confirme o procedimento e a disponibilidade com a clínica por um canal oficial antes de comparecer.', content);
      if (bookingUrl) {
        const link = element('a', 'Consultar agenda oficial', 'clinic-button clinic-button-primary');
        link.href = bookingUrl; link.target = '_blank'; link.rel = 'noopener noreferrer'; content.append(link);
      }
      section('Antes de comparecer', 'Aguarde a confirmação da clínica. Calendário de vagas, documentos complementares e condições para urgências devem ser confirmados com a equipe.', content);
      contactAction(clinic, content);
    }
    hoursSelect.addEventListener('change', showHours);
    showHours();
  }

  function renderLocation(clinic) {
    dialogTitle.textContent = `Como chegar — ${clinic.name}`;
    dialogEyebrow.textContent = 'Localização da clínica-escola';
    const location = clinic.location;
    if (location?.address) {
      dialogBody.append(element('address', location.address));
      const mapUrl = secureUrl(location.mapUrl);
      if (mapUrl) {
        const link = element('a', 'Abrir localização no mapa', 'clinic-button clinic-button-primary');
        link.href = mapUrl; link.target = '_blank'; link.rel = 'noopener noreferrer'; dialogBody.append(link);
      }
    } else {
      section('Localização em confirmação', 'O endereço desta clínica ainda não foi disponibilizado. Confirme o local de atendimento com a equipe antes de se deslocar.', dialogBody, 'clinic-notice');
    }
    contactAction(clinic);
  }

  document.addEventListener('click', event => {
    const trigger = event.target.closest('[data-clinic-action]');
    if (!trigger) return;
    const clinic = CLINICS.find(item => item.id === trigger.dataset.clinic);
    const action = trigger.dataset.clinicAction;
    if (action !== 'hours' && !clinic) return;
    dialogBody.replaceChildren();
    if (action === 'services') renderServices(clinic);
    else if (action === 'hours') renderHours(clinic?.id);
    else if (action === 'location') renderLocation(clinic);
    else return;
    returnFocus = trigger;
    dialog.showModal();
    document.body.classList.add('clinic-dialog-open');
    dialog.querySelector('.clinic-dialog-close').focus();
    dialog.scrollTop = 0;
  });

  dialog.querySelector('.clinic-dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => {
    document.body.classList.remove('clinic-dialog-open');
    returnFocus?.focus({ preventScroll: true });
  });
  dialog.addEventListener('keydown', event => {
    if (event.key === 'Escape') event.stopPropagation();
    trapFocus(event, dialog);
  });
}

function trapFocus(event, root) {
  if (event.key !== 'Tab') return;
  const controls = [...root.querySelectorAll('button:not([disabled]), a[href], select, [tabindex="0"]')].filter(node => node.getClientRects().length);
  const first = controls[0];
  const last = controls.at(-1);
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
}

// Complementa o foco dos modais institucionais sem alterar seu conteúdo/controlador.
function enhanceInstitutionalFocus() {
  const root = document.getElementById('modals-root');
  let opener = null;
  const background = [...document.querySelectorAll('body > header, body > main, body > footer, body > .skip-link')];
  document.querySelectorAll('[data-modal]').forEach(button => button.addEventListener('click', () => { opener = button; }, { capture: true }));
  new MutationObserver(() => {
    const modal = root.querySelector('[role="dialog"]');
    background.forEach(node => { node.inert = Boolean(modal); });
    if (modal) modal.querySelector('button')?.focus();
    else if (opener) { opener.focus({ preventScroll: true }); opener = null; }
  }).observe(root, { childList: true });
  root.addEventListener('keydown', event => trapFocus(event, root));
}

document.addEventListener('DOMContentLoaded', () => {
  initModalController();
  enhanceInstitutionalFocus();
  initClinicPortal();
});
