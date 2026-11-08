/* Associação Meu Sorriso - comportamento do site
   GSAP + ScrollTrigger (movimento ligado ao scroll) e Lenis (rolagem suave), hospedados em js/vendor.
   Regras: nada de listener de scroll na janela, só ScrollTrigger/Lenis; tudo respeita prefers-reduced-motion;
   no mobile e sem JS o conteúdo continua legível (as seções "fixas" viram listas normais). */
(function () {
  "use strict";
  var doc = document, html = doc.documentElement;
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasGsap = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";
  if (reduce) html.classList.add("reduce");
  if (!hasGsap) html.classList.add("no-anim"); else html.classList.remove("no-anim");
  html.classList.add("ready");

  var lenis = null;

  /* ------------------------------------------------------------------ rolagem suave */
  if (hasGsap && !reduce && typeof window.Lenis !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
    lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.95, smoothWheel: true });
    window.lenis = lenis;
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  } else if (hasGsap) {
    gsap.registerPlugin(ScrollTrigger);
  }

  function scrollToY(y, immediate) {
    if (lenis) lenis.scrollTo(y, { immediate: !!immediate, duration: 1.5, easing: function (t) { return 1 - Math.pow(1 - t, 4); } });
    else window.scrollTo({ top: y, behavior: reduce || immediate ? "auto" : "smooth" });
  }
  function scrollToEl(el, immediate) {
    var y = el.getBoundingClientRect().top + window.pageYOffset - 84;
    scrollToY(Math.max(0, y), immediate);
  }
  var norm = function (p) { return p.replace(/index\.html$/, "").replace(/\/$/, ""); };
  doc.addEventListener("click", function (e) {
    var a = e.target.closest("a[href]");
    if (!a || a.target === "_blank") return;
    var u;
    try { u = new URL(a.href, location.href); } catch (err) { return; }
    if (norm(u.pathname) !== norm(location.pathname) || !u.hash) return;
    var target = u.hash === "#top" ? null : $(u.hash);
    if (u.hash !== "#top" && !target) return;
    e.preventDefault();
    if (u.hash === "#top") scrollToY(0); else scrollToEl(target);
    if (history.pushState) history.pushState(null, "", u.hash === "#top" ? location.pathname : u.hash);
    setMenu(false);
  });
  $$("[data-top]").forEach(function (b) { b.addEventListener("click", function (e) { e.preventDefault(); scrollToY(0); }); });

  /* ------------------------------------------------------------------ navegação + menu */
  var nav = $("[data-nav]"), toggle = $(".nav__toggle"), menu = $("#menu");
  function setMenu(open) {
    if (!menu || !toggle) return;
    menu.classList.toggle("is-open", open);
    menu.setAttribute("aria-hidden", open ? "false" : "true");
    html.classList.toggle("menu-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
    if (lenis) { open ? lenis.stop() : lenis.start(); } else { doc.body.style.overflow = open ? "hidden" : ""; }
    if (open) { var first = $("a", menu); if (first) setTimeout(function () { first.focus({ preventScroll: true }); }, 350); }
  }
  if (toggle) toggle.addEventListener("click", function () { setMenu(toggle.getAttribute("aria-expanded") !== "true"); });
  doc.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });
  if (menu) $$("a", menu).forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
  window.matchMedia("(min-width: 900px)").addEventListener("change", function (m) { if (m.matches) setMenu(false); });
  if (lenis && nav) {
    lenis.on("scroll", function (e) {
      var y = e.scroll;
      if (y < 120) nav.classList.remove("is-hidden");
      else if (e.direction > 0 && y > 240) nav.classList.add("is-hidden");
      else if (e.direction < 0) nav.classList.remove("is-hidden");
    });
  }

  /* ------------------------------------------------------------------ acordeão (missão) */
  $$("[data-accordion]").forEach(function (acc) {
    var rows = $$("[data-row]", acc);
    rows.forEach(function (row) {
      var btn = $(".mis__btn", row);
      btn.addEventListener("click", function () {
        var willOpen = !row.classList.contains("is-open");
        rows.forEach(function (r) {
          var o = r === row ? willOpen : false;
          r.classList.toggle("is-open", o);
          $(".mis__btn", r).setAttribute("aria-expanded", o ? "true" : "false");
        });
        if (hasGsap) setTimeout(function () { ScrollTrigger.refresh(); }, 800);
      });
    });
  });

  /* ------------------------------------------------------------------ copiar dados bancários */
  function copyText(t) {
    return new Promise(function (resolve) {
      function fallback() {
        var ta = doc.createElement("textarea");
        ta.value = t; ta.setAttribute("readonly", ""); ta.style.cssText = "position:fixed;opacity:0;top:0;left:0";
        doc.body.appendChild(ta); ta.select();
        try { doc.execCommand("copy"); } catch (err) { /* sem permissão */ }
        ta.remove(); resolve();
      }
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(t).then(resolve, fallback);
      else fallback();
    });
  }
  $$("[data-copy]").forEach(function (b) {
    var label = $("em", b), original = label ? label.textContent : "";
    b.addEventListener("click", function () {
      copyText(b.getAttribute("data-copy")).then(function () {
        b.classList.add("is-done"); if (label) label.textContent = "Copiado";
        setTimeout(function () { b.classList.remove("is-done"); if (label) label.textContent = original; }, 2200);
      });
    });
  });

  /* ------------------------------------------------------------------ formulário de cadastro */
  var form = $("#cadForm");
  if (form) initForm(form);

  function initForm(form) {
    var respList = $("#respList"), msg = $("#formMsg"), count = 0;
    var area = $("[data-form-area]");

    // Gerador dinâmico de cards de responsáveis
    function addResp() {
      var idx = count++;
      var w = doc.createElement("div");
      w.className = "resp";
      w.id = "resp-" + idx;
      w.innerHTML =
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">' +
          '<h3 class="resp__title" style="margin-bottom:0">Responsável ' + (idx + 1) + "</h3>" +
          (idx > 0 ? '<button type="button" class="resp__remove" aria-label="Remover responsável ' + (idx + 1) + '"><svg class="i" viewBox="0 0 256 256"><path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"/></svg></button>' : "") +
        "</div>" +
        '<div class="field">' +
          '<label for="respNome-' + idx + '">Nome completo *</label>' +
          '<input id="respNome-' + idx + '" name="resp_nome[]" type="text" autocomplete="name" required>' +
          '<span class="err">Informe o nome do responsável.</span>' +
        "</div>" +
        '<div class="grid-2">' +
          '<div class="field">' +
            '<label for="respVinculo-' + idx + '">Parentesco / Vínculo *</label>' +
            '<input id="respVinculo-' + idx + '" name="resp_parentesco[]" type="text" placeholder="Mãe, pai, curador(a), cuidador(a)" required>' +
            '<span class="err">Informe o parentesco ou vínculo.</span>' +
          "</div>" +
          '<div class="field">' +
            '<label for="respTel-' + idx + '">Telefone / WhatsApp *</label>' +
            '<input id="respTel-' + idx + '" name="resp_tel[]" type="tel" inputmode="tel" placeholder="(71) 90000-0000" required>' +
            '<span class="err">Informe o telefone.</span>' +
          "</div>" +
        "</div>" +
        '<div class="grid-2">' +
          '<div class="field">' +
            '<label for="respRg-' + idx + '">RG do responsável *</label>' +
            '<input id="respRg-' + idx + '" name="resp_rg[]" type="text" placeholder="Número do RG" required>' +
            '<span class="err">Informe o RG.</span>' +
          "</div>" +
          '<div class="field">' +
            '<label for="respCpf-' + idx + '">CPF do responsável *</label>' +
            '<input id="respCpf-' + idx + '" name="resp_cpf[]" type="text" placeholder="000.000.000-00" required>' +
            '<span class="err">Informe o CPF.</span>' +
          "</div>" +
        "</div>" +
        '<div class="grid-2">' +
          '<div class="field">' +
            '<label for="respGenero-' + idx + '">Gênero *</label>' +
            '<select id="respGenero-' + idx + '" name="resp_genero[]" required>' +
              '<option value="" disabled selected>Selecione</option>' +
              '<option value="Feminino">Feminino</option>' +
              '<option value="Masculino">Masculino</option>' +
              '<option value="Outro">Outro / Prefiro não informar</option>' +
            '</select>' +
            '<span class="err">Selecione o gênero.</span>' +
          "</div>" +
          '<div class="field">' +
            '<label for="respEscolaridade-' + idx + '">Escolaridade *</label>' +
            '<select id="respEscolaridade-' + idx + '" name="resp_escolaridade[]" required>' +
              '<option value="" disabled selected>Selecione</option>' +
              '<option value="Fundamental incompleto">Ensino Fundamental incompleto</option>' +
              '<option value="Fundamental completo">Ensino Fundamental completo</option>' +
              '<option value="Médio completo">Ensino Médio completo</option>' +
              '<option value="Superior completo">Ensino Superior completo</option>' +
              '<option value="Pós-graduação">Pós-graduação</option>' +
            '</select>' +
            '<span class="err">Selecione a escolaridade.</span>' +
          "</div>" +
        "</div>" +
        '<div class="field">' +
          '<label for="respCamisa-' + idx + '">Tamanho da camisa *</label>' +
          '<select id="respCamisa-' + idx + '" name="resp_camisa[]" required>' +
            '<option value="" disabled selected>Selecione o tamanho</option>' +
            '<option value="PP">PP</option>' +
            '<option value="P">P</option>' +
            '<option value="M">M</option>' +
            '<option value="G">G</option>' +
            '<option value="GG">GG</option>' +
            '<option value="XGG">XGG</option>' +
          '</select>' +
          '<span class="err">Selecione o tamanho da camisa.</span>' +
        "</div>";

      respList.appendChild(w);
      var rm = $(".resp__remove", w);
      if (rm) rm.addEventListener("click", function () { w.remove(); });
    }

    var addBtn = $("#addResp");
    if (addBtn && respList) {
      addBtn.addEventListener("click", addResp);
      if (!respList.children.length) addResp();
    }

    form.addEventListener("reset", function () {
      msg.innerHTML = "";
      $$(".has-error", form).forEach(function (f) { f.classList.remove("has-error"); });
      respList.innerHTML = "";
      count = 0;
      addResp();
    });

    form.addEventListener("input", function (e) {
      var f = e.target.closest(".field, .check");
      if (f && f.classList.contains("has-error") && e.target.checkValidity()) f.classList.remove("has-error");
    });

    // Função de upload seguro com isolamento por UUID e validação MIME
    async function uploadDocumentoSeguro(client, fileInput, prefixo, pastaUuid) {
      var file = fileInput.files[0];
      if (!file) throw new Error("Documento obrigatório não anexado: " + prefixo);

      var tiposValidos = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
      if (!tiposValidos.includes(file.type)) {
        throw new Error("Formato não permitido para o arquivo " + file.name + ". Envie PDF ou imagem (JPG/PNG).");
      }
      if (file.size > 5 * 1024 * 1024) {
        throw new Error("O arquivo " + file.name + " excede o limite máximo de 5MB.");
      }

      var ext = file.name.split(".").pop().toLowerCase();
      var hashRandom = (window.crypto && window.crypto.randomUUID) ? window.crypto.randomUUID().slice(0, 8) : Math.random().toString(36).slice(2, 10);
      var caminhoStorage = pastaUuid + "/" + prefixo + "_" + hashRandom + "." + ext;

      var res = await client.storage
        .from("documentos_pcd")
        .upload(caminhoStorage, file, { cacheControl: "3600", upsert: false });

      if (res.error) throw res.error;
      return res.data.path;
    }

    // Submissão blindada do formulário
    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      msg.innerHTML = "";

      // 1. Validação dos termos de uso de equipamentos (todos os checkboxes obrigatórios)
      var condicoesCheckboxes = $$('input[name="condicoes_uso"]', form);
      var todasCondicoesAceitas = condicoesCheckboxes.length > 0 && condicoesCheckboxes.every(function (c) { return c.checked; });

      var bad = $$("input:invalid, textarea:invalid, select:invalid", form);
      $$(".has-error", form).forEach(function (f) { f.classList.remove("has-error"); });

      if (bad.length || !todasCondicoesAceitas) {
        bad.forEach(function (el) { var f = el.closest(".field, .check"); if (f) f.classList.add("has-error"); });
        if (!todasCondicoesAceitas) {
          condicoesCheckboxes.forEach(function (c) {
            if (!c.checked) { var f = c.closest(".check"); if (f) f.classList.add("has-error"); }
          });
        }
        var primeiroErro = bad[0] || $(".has-error", form);
        if (primeiroErro) primeiroErro.scrollIntoView({ behavior: "smooth", block: "center" });
        msg.innerHTML = '<div class="form-error" role="alert">Existem campos ou declarações pendentes. Por favor, confira os itens destacados em vermelho.</div>';
        return;
      }

      var btnSubmit = form.querySelector('button[type="submit"]');
      var btnOriginalText = btnSubmit.innerHTML;
      btnSubmit.disabled = true;
      btnSubmit.textContent = "Validando e enviando documentos...";

      try {
        if (!window.supabaseClient) {
          throw new Error("Falha na conexão com o servidor. Verifique sua conexão com a internet.");
        }

        // 2. Isolamento de pastas por UUID para evitar vazamento ou sobrescrita no Storage
        var pastaSubmissao = (window.crypto && window.crypto.randomUUID) ? window.crypto.randomUUID() : "sub_" + Date.now();
        var pcdId = (window.crypto && window.crypto.randomUUID) ? window.crypto.randomUUID() : null;

        var inputLaudo = $("#docLaudo");
        var inputIdentidade = $("#docIdentidade");
        var inputComprovante = $("#docComprovante");

        btnSubmit.textContent = "Enviando documentos com criptografia...";
        var paths = await Promise.all([
          uploadDocumentoSeguro(window.supabaseClient, inputLaudo, "laudo", pastaSubmissao),
          uploadDocumentoSeguro(window.supabaseClient, inputIdentidade, "identidade", pastaSubmissao),
          uploadDocumentoSeguro(window.supabaseClient, inputComprovante, "comprovante", pastaSubmissao)
        ]);

        btnSubmit.textContent = "Gravando cadastro com segurança...";

        // Função auxiliar defensiva para ler valores de inputs/textareas com segurança
        function val(selector) {
          var el = $(selector, form);
          return el ? el.value.trim() : "";
        }

        function isChecked(selector) {
          var el = $(selector, form);
          return el ? el.checked : false;
        }

        // 3. Montagem do payload da PCD de forma blindada
        var interesses = [];
        $$('input[name="interesse"]:checked', form).forEach(function (c) { 
          interesses.push(c.value); 
        });

        var payloadPcd = {
          nome_completo: val("#pcdNome"),
          data_nascimento: val("#pcdNasc"),
          telefone: val("#pcdTel") || null,
          tipo_deficiencia: val("#pcdDef"),
          interesses: interesses,
          cep: val("#cep").replace(/\D/g, ""),
          cidade: val("#cidade") || "Salvador",
          bairro: val("#bairro"),
          logradouro: val("#logradouro"),
          url_laudo: paths[0],
          url_doc_identidade: paths[1],
          url_comprovante_residencia: paths[2],
          observacoes: val("#obs") || null,
          aceite_estatuto: isChecked("#estatuto"),
          aceite_termo_imagem: isChecked("#aceiteImagem"),
          aceite_condicoes_equipamentos: todasCondicoesAceitas,
          declaracao_veracidade: isChecked("#declaracaoVeracidade"),
          aceite_lgpd: true,
          entrevista_realizada: false,
          inserido_whatsapp: false,
          status: "pendente_entrevista"
        };

        if (pcdId) payloadPcd.id = pcdId;

        // INSERT puro (sem .select() para não exigir leitura do RLS)
        var resPcd = await window.supabaseClient.from("inscricoes_pcd").insert(payloadPcd);
        if (resPcd.error) throw resPcd.error;

      // 4. Montagem e gravação dos responsáveis vinculados
        var nomesResp = $$('input[name="resp_nome[]"]', form);
        var vincResp = $$('input[name="resp_parentesco[]"]', form);
        var telsResp = $$('input[name="resp_tel[]"]', form);
        var rgsResp = $$('input[name="resp_rg[]"]', form);
        var cpfsResp = $$('input[name="resp_cpf[]"]', form);
        var genResp = $$('select[name="resp_genero[]"]', form);
        var escResp = $$('select[name="resp_escolaridade[]"]', form);
        var camResp = $$('select[name="resp_camisa[]"]', form);

        var listaResponsaveis = [];
        for (var i = 0; i < nomesResp.length; i++) {
          var n = nomesResp[i] ? nomesResp[i].value.trim() : "";
          if (n) {
            listaResponsaveis.push({
              pcd_id: pcdId,
              nome_completo: n,
              parentesco_vinculo: vincResp[i] ? vincResp[i].value.trim() : "",
              telefone: telsResp[i] ? telsResp[i].value.trim() : "",
              rg: rgsResp[i] ? rgsResp[i].value.trim() : "",
              cpf: cpfsResp[i] ? cpfsResp[i].value.trim() : "",
              genero: genResp[i] ? genResp[i].value : "",
              escolaridade: escResp[i] ? escResp[i].value : "",
              tamanho_camisa: camResp[i] ? camResp[i].value : ""
            });
          }
        }

        if (listaResponsaveis.length > 0) {
          var resResp = await window.supabaseClient.from("responsaveis_pcd").insert(listaResponsaveis);
          if (resResp.error) throw resResp.error;
        }

        // 5. Sucesso: Tela de confirmação protegida (sem expor documentos ou CPFs em tela)
        form.hidden = true;
        var pcdNome = payloadPcd.nome_completo;
        var msgSucesso = doc.createElement("div");
        msgSucesso.className = "confirm";
        msgSucesso.setAttribute("role", "status");
        msgSucesso.innerHTML =
          "<h2>Cadastro enviado com sucesso!</h2>" +
          "<p>Os dados de <strong>" + esc(pcdNome) + "</strong> e os documentos anexados foram gravados de forma segura e criptografada em nosso servidor.</p>" +
          '<div style="background:var(--surface);border:1.5px solid var(--line);border-radius:var(--r-md);padding:20px;margin:24px 0">' +
            '<p style="margin:0 0 8px"><strong>Próximos passos:</strong></p>' +
            '<ol style="list-style:decimal;padding-left:20px;margin:0;line-height:1.6">' +
              "<li>Nossa equipe técnica avaliará a documentação médica enviada.</li>" +
              "<li>Entraremos em contato pelo telefone cadastrado para <strong>agendar a entrevista presencial de apresentação</strong>.</li>" +
              "<li>Após a entrevista concluída, seu cadastro será homologado e você será incluído no grupo oficial de WhatsApp da Associação.</li>" +
            "</ol>" +
          "</div>" +
          '<div class="confirm__actions">' +
            '<a class="btn btn--primary" href="https://wa.me/5571997220121?text=' + encodeURIComponent("Olá! Enviei a ficha de cadastro e os documentos de " + pcdNome + " pelo site e gostaria de confirmar o recebimento para agendamento da entrevista.") + '" target="_blank" rel="noopener"><svg class="i" viewBox="0 0 256 256"><path d="M187.58,144.84l-32-16a8,8,0,0,0-8,.5l-14.69,9.8a40.55,40.55,0,0,1-16-16l9.8-14.69a8,8,0,0,0,.5-8l-16-32A8,8,0,0,0,104,64a40,40,0,0,0-40,40,88.1,88.1,0,0,0,88,88,40,40,0,0,0,40-40A8,8,0,0,0,187.58,144.84ZM152,176a72.08,72.08,0,0,1-72-72A24,24,0,0,1,99.29,80.46l11.48,23L101,118a8,8,0,0,0-.73,7.51,56.47,56.47,0,0,0,30.15,30.15A8,8,0,0,0,138,155l14.61-9.74,23,11.48A24,24,0,0,1,152,176Z"/></svg>Avisar equipe no WhatsApp</a>' +
            '<a class="btn btn--ghost" href="index.html">Voltar ao início</a>' +
          "</div>";

        area.appendChild(msgSucesso);
        scrollToEl(msgSucesso);

      } catch (err) {
        console.error("Erro durante o processo de cadastro:", err);
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = btnOriginalText;
        msg.innerHTML = '<div class="form-error" role="alert">Ocorreu um erro ao salvar o cadastro: ' + (err.message || err) + '</div>';
        msg.scrollIntoView({ behavior: "smooth" });
      }
    });

    function esc(s) { return String(s || "").replace(/[&<>]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; }); }
  }

  /* ------------------------------------------------------------------ daqui pra frente: só movimento */
  if (!hasGsap || reduce) { finish(); return; }

  /* botões magnéticos: só com mouse; posição vem por variável CSS, o :active continua funcionando */
  if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    $$("[data-magnet]").forEach(function (el) {
      var mx = gsap.quickTo(el, "--mx", { duration: 0.6, ease: "power3" });
      var my = gsap.quickTo(el, "--my", { duration: 0.6, ease: "power3" });
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        mx((e.clientX - (r.left + r.width / 2)) * 0.22);
        my((e.clientY - (r.top + r.height / 2)) * 0.32);
      });
      el.addEventListener("pointerleave", function () { mx(0); my(0); });
    });
  }

  /* hero (home) */
  var hero = $(".hero");
  if (hero) {
    var lines = $$(".hero h1 .ln>span");
    var tl = gsap.timeline({ defaults: { ease: "expo.out" }, delay: 0.1 });
    tl.fromTo(lines, { yPercent: 112, opacity: 1 }, { yPercent: 0, duration: 1.5, stagger: 0.13 }, 0)
      .add(function () { var h = $(".hero .hl"); if (h) h.classList.add("is-on"); }, 0.7)
      .fromTo("[data-hero-in]", { y: 26, opacity: 0 }, { y: 0, opacity: 1, duration: 1.2, stagger: 0.12 }, 0.55)
      .fromTo("[data-hero-disc]", { scale: 0.15, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.8, ease: "expo.out" }, 0.1)
      .fromTo("[data-hero-card]", { scale: 0.9, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.6, stagger: 0.14 }, 0.25)
      .fromTo(".hero__sticker", { rotate: -50 }, { rotate: -10, duration: 1.8, ease: "back.out(1.6)" }, 0.6)
      .fromTo(".hero__main img", { scale: 1.3 }, { scale: 1.02, duration: 2.6, ease: "expo.out" }, 0);
    $$("[data-hero-card]").forEach(function (c) {
      var depth = parseFloat(c.getAttribute("data-depth") || "0.1");
      gsap.to(c, { y: -depth * 720, ease: "none", scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: 0.6 } });
    });
    gsap.to(".hero__disc", { yPercent: 14, scale: 1.08, ease: "none", scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: 0.6 } });
  }

  /* cabeçalhos das páginas internas */
  var ph = $("[data-phead-in]");
  if (ph) {
    gsap.fromTo(ph, { yPercent: 112, opacity: 1 }, { yPercent: 0, duration: 1.5, ease: "expo.out", delay: 0.1 });
    gsap.fromTo("[data-phead-fade]", { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 1.2, ease: "expo.out", stagger: 0.12, delay: 0.35 });
  }
  $$("[data-parallax-img]").forEach(function (img) {
    gsap.fromTo(img, { yPercent: -5 }, { yPercent: 5, ease: "none", scrollTrigger: { trigger: img.parentNode, start: "top bottom", end: "bottom top", scrub: 0.6 } });
  });

  /* revelações genéricas */
  ScrollTrigger.batch("[data-reveal]", {
    start: "top 90%", once: true,
    onEnter: function (b) { gsap.to(b, { opacity: 1, y: 0, duration: 1.2, ease: "expo.out", stagger: 0.1, overwrite: true }); }
  });

  /* contadores */
  $$("[data-count]").forEach(function (el) {
    var to = parseFloat(el.getAttribute("data-count")), from = parseFloat(el.getAttribute("data-from") || "0");
    var pre = el.getAttribute("data-prefix") || "", suf = el.getAttribute("data-suffix") || "", o = { v: from };
    el.textContent = pre + from + suf;
    ScrollTrigger.create({
      trigger: el, start: "top 90%", once: true,
      onEnter: function () {
        gsap.to(o, { v: to, duration: 2.4, ease: "power3.out", onUpdate: function () { el.textContent = pre + Math.round(o.v) + suf; } });
        var st = el.closest("[data-stat]"); if (st) st.classList.add("is-on");
      }
    });
  });

  /* manifesto: cada palavra acende conforme a leitura avança */
  var mp = $("[data-manifesto]");
  if (mp) {
    (function split(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = doc.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (tok) {
            if (!tok) return;
            if (/^\s+$/.test(tok)) frag.appendChild(doc.createTextNode(tok));
            else { var s = doc.createElement("span"); s.className = "w"; s.textContent = tok; frag.appendChild(s); }
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1 && !n.classList.contains("chip")) split(n);
      });
    })(mp);
    var words = $$(".w", mp);
    gsap.set(words, { opacity: 0.16 });
    gsap.to(words, { opacity: 1, ease: "none", stagger: 0.12, scrollTrigger: { trigger: mp, start: "top 78%", end: "bottom 58%", scrub: 0.5 } });
    $$(".chip", mp).forEach(function (c) {
      gsap.fromTo(c, { scale: 0.3, opacity: 0.2 }, { scale: 1, opacity: 1, ease: "none", scrollTrigger: { trigger: c, start: "top 82%", end: "top 58%", scrub: 0.4 } });
    });
  }

  /* imagens que "abrem" ao entrar na tela */
  $$("[data-zoom]").forEach(function (el) {
    var img = $("img", el);
    gsap.fromTo(img, { scale: 1.25 }, { scale: 1, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom 35%", scrub: 0.6 } });
  });

  /* cartões empilhados: o anterior recua quando o próximo chega */
  var cards = $$("[data-scard]");
  cards.forEach(function (card, i) {
    var next = cards[i + 1]; if (!next) return;
    gsap.to(card, { scale: 0.94, "--dim": 0.62, ease: "none", scrollTrigger: { trigger: next, start: "top 88%", end: "top " + (88 + (i + 1) * 26) + "px", scrub: true } });
  });

  /* leque de fotos do acervo */
  var fan = $("[data-fan]");
  if (fan) {
    gsap.from($$("figure", fan), { rotate: 0, xPercent: function (i) { return [55, 0, -55][i]; }, yPercent: 10, duration: 1.8, ease: "expo.out", stagger: 0.1, scrollTrigger: { trigger: fan, start: "top 75%", once: true } });
  }

  /* passos de reserva: a linha desenha conforme você avança */
  var steps = $("[data-steps]");
  if (steps) {
    gsap.fromTo($("[data-steps-line]", steps), { scaleY: 0 }, { scaleY: 1, ease: "none", scrollTrigger: { trigger: steps, start: "top 55%", end: "bottom 60%", scrub: 0.4 } });
    $$("[data-step]", steps).forEach(function (s) {
      ScrollTrigger.create({ trigger: s, start: "top 62%", onEnter: function () { s.classList.add("is-on"); }, onLeaveBack: function () { s.classList.remove("is-on"); } });
    });
  }

  /* bento do acervo */
  var bento = $("[data-bento]");
  if (bento) {
    gsap.set($$("[data-cell]", bento), { opacity: 0 });
    ScrollTrigger.batch($$("[data-cell]", bento), {
      start: "top 90%", once: true,
      onEnter: function (b) { gsap.fromTo(b, { opacity: 0, y: 60, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: 1.3, ease: "expo.out", stagger: 0.09 }); }
    });
  }

  /* marca do rodapé */
  var fm = $(".foot__mark");
  if (fm) gsap.from(fm, { yPercent: 24, opacity: 0, duration: 1.8, ease: "expo.out", scrollTrigger: { trigger: fm, start: "top 96%", once: true } });

  /* ---------------------------------------------------- seções fixas (só desktop) */
  var mm = gsap.matchMedia();

  /* conquistas: rolagem vertical vira pan horizontal */
  mm.add("(min-width: 900px) and (min-height: 560px)", function () {
    var sec = $("[data-wins]"), track = $("[data-wins-track]"), bar = $("[data-wins-bar]");
    if (!sec || !track) return;
    sec.classList.add("is-pinned");
    var dist = function () { return Math.max(0, track.scrollWidth - window.innerWidth); };
    gsap.to(track, {
      x: function () { return -dist(); }, ease: "none",
      scrollTrigger: {
        trigger: sec, start: "top top", end: function () { return "+=" + dist(); },
        pin: true, scrub: 0.8, invalidateOnRefresh: true, anticipatePin: 1,
        onUpdate: function (s) { bar.style.transform = "scaleX(" + s.progress + ")"; }
      }
    });
    return function () { sec.classList.remove("is-pinned"); gsap.set(track, { clearProps: "transform" }); bar.style.transform = ""; };
  });

  /* programas: capítulos que trocam enquanto a seção fica fixa */
  mm.add("(min-width: 1024px) and (min-height: 640px)", function () {
    var sec = $("[data-prog]"), stage = $("[data-prog-stage]"), list = $("[data-prog-list]");
    if (!sec || !stage) return;
    var items = $$(".pcard", stage), n = items.length, cur = -1, btns = [];
    sec.classList.add("is-pinned");
    list.innerHTML = "";
    items.forEach(function (c, i) {
      var b = doc.createElement("button"); b.type = "button"; b.textContent = c.getAttribute("data-title");
      b.addEventListener("click", function () {
        var y = st.start + ((i + 0.5) / n) * (st.end - st.start);
        scrollToY(y);
      });
      list.appendChild(b); btns.push(b);
    });
    function setActive(i) {
      if (i === cur) return; cur = i;
      items.forEach(function (c, k) { c.classList.toggle("is-active", k === i); });
      btns.forEach(function (b, k) { b.setAttribute("aria-current", k === i ? "true" : "false"); });
    }
    setActive(0);
    var st = ScrollTrigger.create({
      trigger: sec, start: "top top", end: function () { return "+=" + Math.round(window.innerHeight * 0.55 * n); },
      pin: true, anticipatePin: 1, invalidateOnRefresh: true,
      onUpdate: function (s) { setActive(Math.min(n - 1, Math.floor(s.progress * n))); }
    });
    return function () {
      sec.classList.remove("is-pinned"); list.innerHTML = "";
      items.forEach(function (c) { c.classList.remove("is-active"); });
    };
  });

  finish();

  function finish() {
    var go = function () {
      if (hasGsap) ScrollTrigger.refresh();
      try { var hEl = location.hash && $(location.hash); if (hEl) scrollToEl(hEl, true); } catch (err) { /* hash invalido */ }
    };
    if (doc.readyState === "complete") setTimeout(go, 60); else window.addEventListener("load", function () { setTimeout(go, 60); });
    if (doc.fonts && doc.fonts.ready && hasGsap) doc.fonts.ready.then(function () { ScrollTrigger.refresh(); });
  }
})();