package com.example.turtrackmanager.service.turtrack;

import com.example.turtrackmanager.model.turtrack.User;
import com.example.turtrackmanager.repository.turtrack.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.*;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService implements OAuth2UserService<OAuth2UserRequest, OAuth2User> {

    private final UserRepository userRepository;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2UserService<OAuth2UserRequest, OAuth2User> delegate =
                new DefaultOAuth2UserService();

        OAuth2User oAuth2User = delegate.loadUser(userRequest);

        // Extract user info and save/update in database if necessary
        String email = oAuth2User.getAttribute("email");

        // Load or create user
        userRepository.findByEmail(email).orElseGet(() -> {
            User newUser = User.builder()
                    .email(email)
                    .firstName(oAuth2User.getAttribute("given_name"))
                    .lastName(oAuth2User.getAttribute("family_name"))
                    .provider(User.AuthProvider.GOOGLE)
                    .subscriptionStatus(User.SubscriptionStatus.NONE)
                    .isActive(true)
                    .build();
            return userRepository.save(newUser);
        });

        return oAuth2User;
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
