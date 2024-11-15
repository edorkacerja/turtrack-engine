package com.example.turtrackmanager.service.manager;

import com.example.turtrackmanager.model.turtrack.User;
import com.example.turtrackmanager.repository.turtrack.UserRepository;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Optional;

@Service
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;

    public CustomOAuth2UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oauth2User = super.loadUser(userRequest);
        return processOAuth2User(userRequest, oauth2User);
    }

    private OAuth2User processOAuth2User(OAuth2UserRequest userRequest, OAuth2User oauth2User) {
        Map<String, Object> attributes = oauth2User.getAttributes();
        String email = (String) attributes.get("email");
        String firstName = (String) attributes.get("given_name");
        String lastName = (String) attributes.get("family_name");
        String imageUrl = (String) attributes.get("picture");

        Optional<User> userOptional = userRepository.findByEmail(email);
        User user;

        if (userOptional.isPresent()) {
            user = userOptional.get();
            if (user.getProvider() == User.AuthProvider.LOCAL) {
                throw new OAuth2AuthenticationException("Account exists with same email but different provider");
            }
            updateExistingUser(user, firstName, lastName, imageUrl);
        } else {
            user = registerNewUser(email, firstName, lastName, imageUrl);
        }

        return oauth2User;
    }

    private User registerNewUser(String email, String firstName, String lastName, String imageUrl) {
        User user = User.builder()
                .email(email)
                .firstName(firstName)
                .lastName(lastName)
                .imageUrl(imageUrl)
                .provider(User.AuthProvider.GOOGLE)
                .isActive(true)
                .build();

        return userRepository.save(user);
    }

    private void updateExistingUser(User user, String firstName, String lastName, String imageUrl) {
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setImageUrl(imageUrl);
        userRepository.save(user);
    }
}
