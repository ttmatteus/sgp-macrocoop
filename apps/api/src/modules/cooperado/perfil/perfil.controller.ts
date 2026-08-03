import { Controller, Get } from '@nestjs/common';
import { PerfilService } from './perfil.service';
import { PerfilDto } from './dto/perfil.dto';

@Controller('perfil')
export class PerfilController {
  // Injeção de dependência: O Controller recebe o Service pelo construtor.
  // O 'readonly' garante que a referência ao service não seja alterada acidentalmente.
    constructor(private readonly perfilService: PerfilService) {}

    @Get()
        async obterPerfil(): Promise<PerfilDto> {
    /**
     * [MOCK PROVISÓRIO - Integração com módulo Auth]
     * Como a autenticação por cookie + denylist ainda está em desenvolvimento,
     * estamos mockando o ID do usuário de teste que já existe no banco.
     * 
     * Futuramente, substituiremos esta linha extraindo o usuário logado via Guard,
     * possivelmente usando um decorator customizado, ex:
     * obterPerfil(@CurrentUser() usuario: UsuarioAutenticado)
     */
    const mockUsuarioLogadoId = 1;

    // Delegamos a regra de busca (Pessoa + VinculoCooperativa) para a camada de Service
    return this.perfilService.buscarPerfilDoCooperado(mockUsuarioLogadoId);
  }
}