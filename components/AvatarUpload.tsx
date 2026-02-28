import React, { useRef, useState } from 'react';
import { supabase } from '../services/supabaseClient';

interface AvatarUploadProps {
    userId: string;
    currentAvatarUrl: string | null;
    onAvatarChange: (newUrl: string) => void;
    size?: string;
}

const AvatarUpload: React.FC<AvatarUploadProps> = ({ userId, currentAvatarUrl, onAvatarChange, size = 'w-14 h-14' }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);

    const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent('Aluno')}&background=164BB6&color=fff&size=128`;

    const handleClick = () => {
        if (!isUploading) {
            fileInputRef.current?.click();
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validar tamanho (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            alert('A imagem deve ter no máximo 2MB.');
            return;
        }

        setIsUploading(true);

        try {
            const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
            const filePath = `${userId}/avatar.${fileExt}`;

            // Remover avatar anterior (ignora erro se não existir)
            await supabase.storage.from('avatars').remove([`${userId}/avatar.jpg`, `${userId}/avatar.png`, `${userId}/avatar.webp`]);

            // Upload da nova imagem
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file, { upsert: true, contentType: file.type });

            if (uploadError) {
                console.error('Erro no upload:', uploadError);
                alert('Erro ao enviar a foto. Tente novamente.');
                setIsUploading(false);
                return;
            }

            // Obter URL pública
            const { data: urlData } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            const newUrl = `${urlData.publicUrl}?t=${Date.now()}`;

            // Salvar URL no perfil do usuário
            await supabase.auth.updateUser({
                data: { avatar_url: newUrl }
            });

            onAvatarChange(newUrl);
        } catch (err) {
            console.error('Erro inesperado:', err);
            alert('Erro ao trocar a foto.');
        } finally {
            setIsUploading(false);
            // Resetar input para permitir selecionar o mesmo arquivo novamente
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="relative group cursor-pointer" onClick={handleClick}>
            <img
                alt="Foto do Aluno"
                className={`${size} rounded-full object-cover border-2 border-primary/30 transition-opacity ${isUploading ? 'opacity-50' : 'group-hover:opacity-80'}`}
                src={currentAvatarUrl || defaultAvatar}
            />
            {/* Overlay de edição */}
            <div className={`absolute inset-0 rounded-full flex items-center justify-center transition-opacity ${isUploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                {isUploading ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                    <div className="bg-black/50 rounded-full p-1.5">
                        <span className="material-icons-round text-white text-sm">photo_camera</span>
                    </div>
                )}
            </div>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileChange}
            />
        </div>
    );
};

export default AvatarUpload;
